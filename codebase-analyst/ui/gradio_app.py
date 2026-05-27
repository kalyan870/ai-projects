import gradio as gr
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from repo_loader.loader import RepoLoader
from parser.code_parser import CodeParser
from embeddings.embedder import CodeEmbedder
from vector_db.lance_db import LanceVectorDB
from llm.qa_engine import QAEngine
from summaries.repo_summary import RepoSummarizer

class CodebaseAnalystUI:
    def __init__(self):
        self.loader = RepoLoader()
        self.parser = CodeParser()
        self.embedder = CodeEmbedder()
        self.vector_db = LanceVectorDB()
        self.qa = QAEngine()
        self.summarizer = RepoSummarizer()
        self.is_loaded = False

    def load_repo(self, repo_input: str, is_url: bool):
        try:
            if is_url:
                path = self.loader.clone_repo(repo_input)
            else:
                self.loader.load_local(repo_input)
                path = repo_input

            files = self.loader.get_all_files()
            tree = self.loader.get_directory_tree()

            chunks = self.parser.parse_all(files)
            chunks = self.embedder.embed_chunks(chunks)

            table_name = "codebase"
            self.vector_db.create_table(table_name, self.embedder.dimension, overwrite=True)
            self.vector_db.insert(table_name, chunks)

            overview = self.summarizer.generate_overview(files, tree)
            deps = self.summarizer.get_dependencies(files)

            self.is_loaded = True

            return (
                f"Loaded {overview['total_files']} files, {overview['total_lines']} chars\n"
                f"Created {len(chunks)} code chunks\n"
                f"Languages: {', '.join(f'{k}: {v}' for k, v in overview['languages'].items())}\n\n"
                f"Directory Tree:\n{tree[:1500]}"
            )
        except Exception as e:
            return f"Error: {str(e)}"

    def ask_question(self, question: str):
        if not self.is_loaded:
            return "Please load a repository first."
        if not question.strip():
            return "Please enter a question."

        try:
            query_embedding = self.embedder.embed(question)
            results = self.vector_db.search("codebase", query_embedding, limit=8)
            answer = self.qa.answer(question, results)

            context_used = "\n\n".join([
                eval(r.get("metadata", "{}")).get("file", "unknown")
                for r in results
            ])
            return f"{answer}\n\n---\nSources:\n{context_used}"
        except Exception as e:
            return f"Error: {str(e)}"

    def create_ui(self):
        with gr.Blocks(title="Codebase Analyst", theme=gr.themes.Soft()) as demo:
            gr.Markdown("# <center>Codebase Analyst</center>")
            gr.Markdown("<center>Upload any repo and ask questions about its architecture</center>")

            with gr.Tab("Load Repository"):
                with gr.Row():
                    repo_url = gr.Textbox(label="GitHub URL", placeholder="https://github.com/user/repo")
                    load_url_btn = gr.Button("Clone & Load", variant="primary")
                with gr.Row():
                    local_path = gr.Textbox(label="Local Path", placeholder="C:/path/to/repo")
                    load_local_btn = gr.Button("Load Local", variant="secondary")
                output_info = gr.Textbox(label="Repository Info", lines=15)

                load_url_btn.click(
                    lambda url: self.load_repo(url, True),
                    inputs=[repo_url], outputs=[output_info]
                )
                load_local_btn.click(
                    lambda path: self.load_repo(path, False),
                    inputs=[local_path], outputs=[output_info]
                )

            with gr.Tab("Ask Questions"):
                question = gr.Textbox(
                    label="Ask about the codebase",
                    placeholder="How does authentication work?",
                    lines=3
                )
                ask_btn = gr.Button("Ask", variant="primary")
                answer = gr.Textbox(label="Answer", lines=20)
                ask_btn.click(self.ask_question, inputs=[question], outputs=[answer])

            with gr.Tab("Quick Actions"):
                gr.Markdown("""
                **Example questions:**
                - What is the architecture of this project?
                - How are errors handled?
                - What is the main entry point?
                - List all API endpoints
                - How does the data flow work?
                - What dependencies are used?
                """)

            return demo

if __name__ == "__main__":
    ui = CodebaseAnalystUI()
    demo = ui.create_ui()
    demo.launch(server_name="0.0.0.0", server_port=7860)
