import os
import git
from pathlib import Path
from typing import List, Dict, Any

SUPPORTED_EXTENSIONS = {'.py', '.js', '.ts', '.jsx', '.tsx', '.md', '.txt', '.json', '.yaml', '.yml', '.toml', '.cfg', '.ini'}
IGNORE_DIRS = {'node_modules', '__pycache__', '.git', 'venv', '.venv', 'dist', 'build', '.next', '.vscode'}

class RepoLoader:
    def __init__(self, repo_path: str = None):
        self.repo_path = repo_path
        self.files = []

    def clone_repo(self, repo_url: str, target_dir: str = "repos") -> str:
        repo_name = repo_url.rstrip('/').split('/')[-1].replace('.git', '')
        local_path = os.path.join(target_dir, repo_name)
        if os.path.exists(local_path):
            return local_path
        git.Repo.clone_from(repo_url, local_path)
        self.repo_path = local_path
        return local_path

    def load_local(self, path: str):
        self.repo_path = path

    def get_all_files(self) -> List[Dict[str, Any]]:
        self.files = []
        for root, dirs, files in os.walk(self.repo_path):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            for f in files:
                ext = os.path.splitext(f)[1].lower()
                if ext in SUPPORTED_EXTENSIONS:
                    filepath = os.path.join(root, f)
                    try:
                        with open(filepath, 'r', encoding='utf-8', errors='ignore') as fh:
                            content = fh.read()
                        self.files.append({
                            'path': os.path.relpath(filepath, self.repo_path),
                            'extension': ext,
                            'size': len(content),
                            'content': content
                        })
                    except:
                        pass
        return self.files

    def get_directory_tree(self) -> str:
        tree = []
        for root, dirs, files in os.walk(self.repo_path):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            level = root.replace(self.repo_path, '').count(os.sep)
            indent = '  ' * level
            tree.append(f"{indent}{os.path.basename(root)}/")
            for f in files:
                ext = os.path.splitext(f)[1].lower()
                if ext in SUPPORTED_EXTENSIONS:
                    tree.append(f"{indent}  {f}")
        return '\n'.join(tree)

    def get_file_count(self) -> int:
        return len(self.files) if self.files else len(self.get_all_files())
