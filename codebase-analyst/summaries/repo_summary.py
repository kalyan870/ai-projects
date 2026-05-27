from typing import List, Dict, Any
import os

class RepoSummarizer:
    def generate_overview(self, files: List[Dict[str, Any]], directory_tree: str) -> Dict[str, Any]:
        languages = {}
        for f in files:
            ext = f['extension']
            languages[ext] = languages.get(ext, 0) + 1

        total_lines = sum(f['size'] for f in files)

        return {
            "total_files": len(files),
            "total_lines": total_lines,
            "languages": languages,
            "directory_tree": directory_tree,
            "largest_files": sorted(files, key=lambda x: x['size'], reverse=True)[:10]
        }

    def get_dependencies(self, files: List[Dict[str, Any]]) -> Dict[str, List[str]]:
        imports = {"python": [], "javascript": []}
        for f in files:
            content = f['content']
            if f['extension'] == '.py':
                for line in content.split('\n'):
                    if line.startswith(('import ', 'from ')):
                        imports["python"].append(line.strip())
            elif f['extension'] in ('.js', '.ts', '.jsx', '.tsx'):
                for line in content.split('\n'):
                    if 'require(' in line or 'from ' in line:
                        imports["javascript"].append(line.strip())
        return imports

    def save_summary(self, summary: Dict[str, Any], output_dir: str = "summaries"):
        os.makedirs(output_dir, exist_ok=True)
        import json
        with open(os.path.join(output_dir, "repo_summary.json"), "w") as f:
            json.dump(summary, f, indent=2, default=str)
