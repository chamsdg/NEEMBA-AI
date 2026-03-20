import requests
import json
import re
import logging
import hashlib
from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Stub pour microsoft_service (non disponible pour le moment)
class MicrosoftServiceStub:
    def __getattr__(self, name):
        return lambda *args, **kwargs: {"status": "error", "response": "Service Microsoft non disponible"}

microsoft_service = MicrosoftServiceStub()

class SnowflakeAgentService:
    """Service pour appeler les agents Cortex Snowflake"""
    
    def __init__(self):
        self.settings = get_settings()
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {self.settings.snowflake_pat}",
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
        })
    
    def call_agent(self, question: str, agent_name: str = None) -> dict:
        """Appeler un agent Cortex via API REST"""
        try:
            agent = agent_name or self.settings.agent_name
            
            url = (
                f"https://{self.settings.snowflake_account}.snowflakecomputing.com"
                f"/api/v2/databases/{self.settings.snowflake_database}/"
                f"schemas/{self.settings.snowflake_schema}/"
                f"agents/{agent}:run"
            )
            
            payload = {
                "messages": [
                    {
                        "role": "system",
                        "content": [{"type": "text", "text": """## Instructions

Tu assistes l'équipe de NEEMBA Mali pour l'analyse de données et la génération d'insights via Snowflake Cortex.

**IMPORTANT:**
- Réponds toujours en français, de manière claire et structurée
- Fais une **analyse COMPLÈTE** avec commentaires et explications détaillés
- Explique tes résultats et donne du contexte
- Si tu dois inclure un tableau, génère-le au format Markdown avec des entêtes clairs
- Commente chaque résultat pour aider à la compréhension
- Utilise des sections bien organisées (titres, sous-titres)
- Évite les répétitions et les doublons dans les données
- Sois professionnel mais accessible"""
                    }]
                    },
                    {
                        "role": "user",
                        "content": [{"type": "text", "text": question}]
                    }
                ]
            }
            
            logger.info(f"Appel à {agent}")
            
            response = self.session.post(url, json=payload, stream=True, timeout=(30, 60))
            
            if response.status_code >= 400:
                logger.error(f"Erreur {response.status_code}")
                return {
                    "status": "error",
                    "response": f"Erreur API: {response.text[:300]}",
                }
            
            # Accumuler la réponse
            sent = ""
            sent_norm = ""
            last_norm_chunk = ""
            current_event = ""
            response.encoding = "utf-8"
            
            def normalize(s: str) -> str:
                return " ".join((s or "").split())
            
            try:
                for raw_line in response.iter_lines(decode_unicode=True):
                    try:
                        if raw_line is None or raw_line == "":
                            current_event = ""
                            continue
                        
                        line = raw_line.strip()
                        
                        if line.startswith("event:"):
                            current_event = line.split("event:", 1)[1].strip().lower()
                            logger.debug(f"Event: {current_event}")
                            continue
                        
                        if not line.startswith("data:"):
                            continue
                        
                        # Ignorer les événements de status/thinking/debug
                        if current_event and any(ignore in current_event for ignore in ["thinking", "status", "debug", "trace"]):
                            logger.debug(f"Ignoré: {current_event}")
                            continue
                        
                        data_str = line.split("data:", 1)[1].strip()
                        try:
                            data = json.loads(data_str) if data_str else {}
                        except json.JSONDecodeError:
                            continue
                        
                        text = self.extract_text_chunk(data)
                        if not text or not text.strip():
                            continue
                        
                        # Éviter de traiter les "thinking" blocks dans les données
                        if "<thinking>" in text.lower() or "réfléchiss" in text.lower():
                            # On les gardera pour la phase de nettoyage
                            pass
                        
                        # Accumulation simple - la déduplication se fait à la fin
                        sent += text
                    
                    except Exception as e:
                        logger.error(f"Erreur traitement ligne: {e}")
                        continue
            
            except Exception as e:
                logger.error(f"Erreur SSE: {e}")
            
            # Nettoyer les doublons à la fin seulement
            cleaned = self._remove_duplicates(sent.strip()) if sent.strip() else ""
            
            # Nettoyer le contenu inutile avant les sections principales
            cleaned = self._clean_response(cleaned)
            
            return {
                "status": "success",
                "response": cleaned,
            }
        
        except requests.exceptions.Timeout:
            logger.error("Timeout")
            return {
                "status": "error",
                "response": "Timeout: L'agent a mis trop longtemps",
            }
        except Exception as e:
            logger.error(f"Erreur: {e}")
            return {
                "status": "error",
                "response": f"Erreur: {str(e)[:300]}",
            }
    
    def extract_text_chunk(self, data: dict) -> str:
        """Extraire le texte d'un chunk"""
        candidates = [
            data.get("text"),
            data.get("delta"),
            data.get("content"),
            data.get("message"),
            data.get("output_text"),
        ]
        for chunk in candidates:
            if isinstance(chunk, str) and chunk.strip():
                return chunk
            if isinstance(chunk, dict):
                if isinstance(chunk.get("text"), str) and chunk["text"].strip():
                    return chunk["text"]
        return ""
    
    def _remove_duplicates(self, text: str) -> str:
        """Supprimer les sections dupliquées (tableaux, paragraphes, blocs)"""
        if not text:
            return text
        
        lines = text.split('\n')
        result = []
        seen_lines = set()
        i = 0
        
        while i < len(lines):
            line = lines[i]
            stripped = line.strip()
            
            # Ligne vide
            if not stripped:
                # Garder une ligne vide si la dernière n'était pas vide
                if result and result[-1].strip():
                    result.append(line)
                i += 1
                continue
            
            # Détection d'un tableau markdown
            if stripped.startswith('|'):
                table_lines = []
                j = i
                while j < len(lines) and (lines[j].strip().startswith('|') or (lines[j].strip() and all(c in '-| :' for c in lines[j].replace(' ', '')))):
                    table_lines.append(lines[j])
                    j += 1
                
                # Normaliser le contenu du tableau pour comparaison
                table_content = '\n'.join(table_lines).replace(' ', '').replace('%', '')
                table_hash = hashlib.md5(table_content.encode()).hexdigest()
                
                if table_hash not in seen_lines:
                    result.extend(table_lines)
                    seen_lines.add(table_hash)
                
                i = j
                continue
            
            # Sinon, vérifier si on a déjà cette ligne/section
            # Crée un hash du contenu (sans espaces inutiles)
            normalized_line = ' '.join(stripped.split())
            line_hash = hashlib.md5(normalized_line.encode()).hexdigest()
            
            if line_hash not in seen_lines:
                result.append(line)
                seen_lines.add(line_hash)
            
            i += 1
        
        # Nettoyer les excès d'espaces
        cleaned = '\n'.join(result)
        cleaned = re.sub(r'\n\n\n+', '\n\n', cleaned)
        return cleaned.strip()
    
    def _clean_response(self, text: str) -> str:
        """Nettoyer les réponses - supprimer seulement les doublons vrais"""
        if not text:
            return text
        
        # Supprimer seulement les blocs de thinking XML stricts (non le contenu analyste)
        text = re.sub(r'<thinking>.*?</thinking>', '', text, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r'<_?thinking[^>]*>.*?</_?thinking>', '', text, flags=re.DOTALL | re.IGNORECASE)
        
        # Supprimer les comments XML
        text = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)
        
        # Nettoyer les espaces excessifs
        text = re.sub(r'\n\n\n+', '\n\n', text)
        
        return text.strip()



# Service global
snowflake_service = SnowflakeAgentService()
