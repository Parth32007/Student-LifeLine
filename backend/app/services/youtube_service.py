import re
import logging
from typing import Dict, Any, Optional
from youtube_transcript_api import YouTubeTranscriptApi
from app.services.gemini_service import gemini_service

logger = logging.getLogger("lifeos.youtube")

class YouTubeService:

    @staticmethod
    def extract_video_id(url: str) -> Optional[str]:
        """Extracts YouTube 11-character video ID from URL."""
        pattern = r"(?:v=|\/)([0-9A-Za-z_-]{11}).*"
        match = re.search(pattern, url)
        if match:
            return match.group(1)
        return None

    def fetch_transcript(self, video_id: str) -> Optional[str]:
        """Fetches English or auto-generated transcript from YouTube."""
        try:
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
            full_text = " ".join([entry["text"] for entry in transcript_list])
            return full_text
        except Exception as e:
            logger.warning(f"Could not retrieve YouTube transcript for {video_id}: {e}")
            return None

    async def analyze_lecture(
        self,
        url: str,
        custom_notes: Optional[str] = None
    ) -> Dict[str, Any]:
        video_id = self.extract_video_id(url)
        if not video_id:
            raise ValueError("Invalid YouTube URL provided.")

        transcript = self.fetch_transcript(video_id)
        content_to_analyze = transcript or custom_notes or f"YouTube Lecture video ID: {video_id}"

        prompt = (
            f"You are Student Lifeline Academic Intelligence. Analyze this YouTube lecture content:\n\n"
            f"{content_to_analyze[:6000]}\n\n"
            "Generate a structured JSON response with:\n"
            "- 'title': suitable descriptive academic title\n"
            "- 'summary': thorough 3-4 sentence summary of the lecture\n"
            "- 'key_concepts': list of key concepts and their explanations\n"
            "- 'timestamps': list of objects with 'time' (e.g. '04:15') and 'topic' describing key moments\n"
            "- 'flashcards': list of 3-5 flashcard objects with 'question' and 'answer'\n"
            "- 'quiz_questions': list of 3 multiple choice questions with 'question', 'options' (array), 'correct_answer'"
        )

        ai_analysis = await gemini_service.generate_json(prompt)
        if not ai_analysis:
            ai_analysis = {
                "title": f"Lecture Notes (Video {video_id})",
                "summary": "Video added to Student Lifeline knowledge base. Watch and track key concepts alongside your syllabus.",
                "key_concepts": [],
                "timestamps": [],
                "flashcards": [],
                "quiz_questions": []
            }

        thumbnail_url = f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"

        return {
            "video_id": video_id,
            "title": ai_analysis.get("title", f"Lecture {video_id}"),
            "thumbnail_url": thumbnail_url,
            "transcript": transcript,
            "summary": ai_analysis.get("summary"),
            "key_concepts": ai_analysis.get("key_concepts", []),
            "timestamps": ai_analysis.get("timestamps", []),
            "generated_flashcards": ai_analysis.get("flashcards", []),
            "generated_quiz_questions": ai_analysis.get("quiz_questions", [])
        }

youtube_service = YouTubeService()
