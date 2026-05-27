from typing import List, Dict, Any
import ast
import re

class CodeParser:
    def parse_python(self, content: str, filepath: str = "") -> List[Dict[str, Any]]:
        chunks = []
        try:
            tree = ast.parse(content)
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    chunks.append({
                        'type': 'function',
                        'name': node.name,
                        'start': node.lineno,
                        'end': node.end_lineno,
                        'content': content[node.lineno-1:node.end_lineno],
                        'file': filepath
                    })
                elif isinstance(node, ast.ClassDef):
                    chunks.append({
                        'type': 'class',
                        'name': node.name,
                        'start': node.lineno,
                        'end': node.end_lineno,
                        'content': content[node.lineno-1:node.end_lineno],
                        'file': filepath
                    })
        except SyntaxError:
            chunks.append({'type': 'module', 'name': filepath, 'content': content[:2000], 'file': filepath})
        return chunks

    def parse_javascript(self, content: str, filepath: str = "") -> List[Dict[str, Any]]:
        chunks = []
        func_pattern = r'(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?(?:function|\(.*?\)\s*=>))'
        class_pattern = r'class\s+(\w+)'

        for match in re.finditer(func_pattern, content):
            name = match.group(1) or match.group(2)
            start = content.rfind('\n', 0, match.start()) + 1
            chunks.append({
                'type': 'function',
                'name': name,
                'content': content[match.start():match.start()+500],
                'file': filepath
            })

        for match in re.finditer(class_pattern, content):
            chunks.append({
                'type': 'class',
                'name': match.group(1),
                'content': content[match.start():match.start()+500],
                'file': filepath
            })

        if not chunks:
            chunks.append({'type': 'module', 'name': filepath, 'content': content[:2000], 'file': filepath})

        return chunks

    def chunk_file(self, content: str, filepath: str) -> List[Dict[str, Any]]:
        ext = filepath.split('.')[-1] if '.' in filepath else ''
        if ext == 'py':
            return self.parse_python(content, filepath)
        elif ext in ('js', 'ts', 'jsx', 'tsx'):
            return self.parse_javascript(content, filepath)
        else:
            lines = content.split('\n')
            chunk_size = 200
            return [
                {'type': 'text', 'name': f'{filepath}:{i}', 'content': '\n'.join(lines[i:i+chunk_size]), 'file': filepath}
                for i in range(0, len(lines), chunk_size)
            ]

    def parse_all(self, files: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        chunks = []
        for f in files:
            chunks.extend(self.chunk_file(f['content'], f['path']))
        return chunks
