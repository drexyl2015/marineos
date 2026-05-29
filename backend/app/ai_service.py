"""Claude AI Service for Maritime Compliance and Document Analysis"""
import anthropic
from app.config import settings
import json
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app import models


class MarineAIService:
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=settings.CLAUDE_API_KEY)
        self.model = "claude-sonnet-4-6"

    # ── 17 Maritime Tool Definitions ─────────────────────────────────────────

    MARITIME_TOOLS = [
        {
            "name": "search_crew",
            "description": "Search crew members by name, position, nationality, or employment status.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "query":       {"type": "string", "description": "Name or partial name to search"},
                    "status":      {"type": "string", "description": "'available', 'onboard', 'leave', or 'inactive'"},
                    "position":    {"type": "string", "description": "Job position to filter by"},
                    "nationality": {"type": "string", "description": "Country of nationality"},
                },
            },
        },
        {
            "name": "get_crew_profile",
            "description": "Get full profile of a crew member including all certificates, assignments, and alerts.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "crew_id": {"type": "integer", "description": "Numeric ID of the crew member"},
                },
                "required": ["crew_id"],
            },
        },
        {
            "name": "get_expiring_certificates",
            "description": "Find certificates expiring within a given number of days. Use this to spot compliance risks.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "days_ahead": {"type": "integer", "description": "Number of days to look ahead (default 90)"},
                    "crew_id":    {"type": "integer", "description": "Limit to a specific crew member (optional)"},
                },
            },
        },
        {
            "name": "get_available_crew",
            "description": "List all crew currently available for vessel assignment, optionally filtered by position.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "position": {"type": "string", "description": "Filter by job position (optional)"},
                },
            },
        },
        {
            "name": "get_active_alerts",
            "description": "Retrieve unresolved compliance alerts across the fleet.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "severity": {"type": "string", "description": "'high', 'medium', or 'low' (optional)"},
                    "crew_id":  {"type": "integer", "description": "Limit to a specific crew member (optional)"},
                },
            },
        },
        {
            "name": "get_fleet_compliance_summary",
            "description": "Get an overall snapshot of fleet compliance: crew counts, certificate stats, expiry breakdown.",
            "input_schema": {"type": "object", "properties": {}},
        },
        {
            "name": "get_vessel_manifest",
            "description": "Get the current crew manifest for a specific vessel.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "vessel_id": {"type": "integer", "description": "Vessel ID"},
                },
                "required": ["vessel_id"],
            },
        },
        {
            "name": "search_certificates",
            "description": "Search certificates by type or for a specific crew member.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "certificate_type": {"type": "string", "description": "Type of certificate (e.g. STCW Basic Safety, GMDSS)"},
                    "crew_id":          {"type": "integer", "description": "Crew member ID (optional)"},
                },
            },
        },
        {
            "name": "get_crew_assignments",
            "description": "Get assignment history for a crew member or all assignments for a vessel.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "crew_id":   {"type": "integer", "description": "Crew member ID (optional)"},
                    "vessel_id": {"type": "integer", "description": "Vessel ID (optional)"},
                    "status":    {"type": "string",  "description": "'active' or 'completed' (optional)"},
                },
            },
        },
        {
            "name": "check_crew_compliance",
            "description": "Run a full STCW/MLC/SOLAS compliance check for a crew member using AI analysis.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "crew_id": {"type": "integer", "description": "Crew member ID"},
                },
                "required": ["crew_id"],
            },
        },
        {
            "name": "assess_crew_risk",
            "description": "Get a predictive compliance risk assessment for a crew member (certificate expiry, gaps, training).",
            "input_schema": {
                "type": "object",
                "properties": {
                    "crew_id": {"type": "integer", "description": "Crew member ID"},
                },
                "required": ["crew_id"],
            },
        },
        {
            "name": "generate_port_briefing",
            "description": "Generate a full AI port arrival compliance briefing for a vessel at a specific port.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "vessel_id": {"type": "integer", "description": "Vessel ID"},
                    "port_name": {"type": "string",  "description": "Port name (e.g. Singapore, Rotterdam)"},
                },
                "required": ["vessel_id", "port_name"],
            },
        },
        {
            "name": "recommend_crew_for_position",
            "description": "Get AI-powered crew recommendations to fill a specific position on a vessel.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "vessel_id": {"type": "integer", "description": "Vessel ID"},
                    "position":  {"type": "string",  "description": "Position to fill (e.g. Chief Officer, AB Seaman)"},
                },
                "required": ["vessel_id", "position"],
            },
        },
        {
            "name": "analyze_crew_pool",
            "description": "Get a strategic AI analysis of the crew pool: utilization, gaps, and hiring priorities.",
            "input_schema": {"type": "object", "properties": {}},
        },
        {
            "name": "lookup_stcw_requirement",
            "description": "Look up STCW 2010 requirements for a certificate type or officer position.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "certificate_type": {"type": "string", "description": "Certificate name (e.g. STCW Basic Safety, GMDSS General Operator)"},
                    "position":         {"type": "string", "description": "Officer or rating position (optional)"},
                },
            },
        },
        {
            "name": "lookup_mlc_requirement",
            "description": "Look up MLC 2006 obligations for a given topic (rest hours, medical fitness, repatriation, etc.).",
            "input_schema": {
                "type": "object",
                "properties": {
                    "topic": {"type": "string", "description": "Topic to look up (e.g. rest hours, SEA terms, medical certificate)"},
                },
                "required": ["topic"],
            },
        },
        {
            "name": "get_watchkeeping_requirements",
            "description": "Get STCW watchkeeping hours, rest period requirements, and manning rules for a vessel type.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "vessel_type": {"type": "string", "description": "Type of vessel (e.g. tanker, bulk carrier, passenger ship)"},
                    "route":       {"type": "string", "description": "Route type: coastal, international, or short-sea (optional)"},
                },
            },
        },
    ]

    # ── Agentic Chat with Tool Use ────────────────────────────────────────────

    def chat_with_tools(self, message: str, history: list, context: dict, db: Session) -> Dict:
        """
        Agentic tool-use chat loop using Claude's tool_use API.
        Executes tool calls against live DB, then lets Claude formulate a response.
        Returns: {reply, history, tools_used}
        """
        system = (
            "You are the MarineDoc Assistant — a concise help assistant for the MarineDoc system.\n\n"
            "SCOPE: Only answer questions about this system's features: crew management, certificates, "
            "documents, compliance alerts, and the AI tools available here.\n\n"
            "RULES:\n"
            "- Keep ALL replies under 100 words. Be direct and precise.\n"
            "- Do NOT give lengthy explanations or act like a general AI chatbot.\n"
            "- For detailed STCW/MLC/SOLAS/PSC questions, give one short sentence then refer to the official site.\n"
            "- If a question is outside this system's scope, say so in one line and point to a relevant site.\n\n"
            "REFERENCE LINKS (use when needed):\n"
            "- STCW: https://www.imo.org/en/OurWork/HumanElement/Pages/STCW-Conv.aspx\n"
            "- MLC 2006: https://www.ilo.org/maritime\n"
            "- SOLAS: https://www.imo.org/en/About/Conventions/Pages/SOLAS.aspx\n"
            "- Paris MOU: https://www.parismou.org\n"
            "- Tokyo MOU: https://www.tokyo-mou.org\n"
        )

        if context.get("role"):
            system += f"\n\nCurrent user role: {context['role']}"

        messages = list(history) + [{"role": "user", "content": message}]
        tools_used: List[str] = []

        try:
          while True:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=400,
                system=system,
                tools=self.MARITIME_TOOLS,
                messages=messages,
            )

            # Serialize assistant turn — convert content blocks to dicts for JSON transport
            assistant_content = [
                block.model_dump() if hasattr(block, "model_dump") else block
                for block in response.content
            ]
            messages.append({"role": "assistant", "content": assistant_content})

            if response.stop_reason == "end_turn":
                reply = next(
                    (block.text for block in response.content if hasattr(block, "text")),
                    "",
                )
                return {"reply": reply, "history": messages, "tools_used": tools_used}

            if response.stop_reason == "tool_use":
                tool_results = []
                for block in response.content:
                    if not hasattr(block, "type") or block.type != "tool_use":
                        continue
                    tools_used.append(block.name)
                    result = self._execute_tool(block.name, block.input, db)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": json.dumps(result, default=str),
                    })
                messages.append({"role": "user", "content": tool_results})
            else:
                # max_tokens or other unexpected stop — return whatever text we have
                reply = next(
                    (block.text for block in response.content if hasattr(block, "text")), ""
                )
                return {
                    "reply": reply or "Response was cut short. Please try again.",
                    "history": messages,
                    "tools_used": tools_used,
                }

        except Exception as exc:
            error_msg = str(exc)
            lower = error_msg.lower()
            if "authentication" in lower or "api_key" in lower or "401" in error_msg:
                user_msg = "AI service authentication error. Please check the API key configuration."
            elif "rate" in lower or "429" in error_msg:
                user_msg = "AI service is busy right now. Please wait a moment and try again."
            elif "timeout" in lower or "connection" in lower:
                user_msg = "Cannot reach the AI service. Please check your internet connection and try again."
            else:
                user_msg = f"AI service error: {error_msg[:300]}"
            return {
                "reply": user_msg,
                "history": list(history) + [{"role": "user", "content": message}],
                "tools_used": tools_used,
            }

    # ── Tool Dispatcher ───────────────────────────────────────────────────────

    def _execute_tool(self, name: str, inputs: dict, db: Session) -> dict:
        """Route a Claude tool call to the correct handler."""
        dispatch = {
            "search_crew":               self._tool_search_crew,
            "get_crew_profile":          self._tool_get_crew_profile,
            "get_expiring_certificates": self._tool_get_expiring_certificates,
            "get_available_crew":        self._tool_get_available_crew,
            "get_active_alerts":         self._tool_get_active_alerts,
            "get_fleet_compliance_summary": self._tool_fleet_summary,
            "get_vessel_manifest":       self._tool_vessel_manifest,
            "search_certificates":       self._tool_search_certificates,
            "get_crew_assignments":      self._tool_get_assignments,
            # AI-analysis tools delegate to existing methods
            "check_crew_compliance":      lambda i, d: self.check_regulatory_compliance(i["crew_id"], d),
            "assess_crew_risk":           lambda i, d: self.assess_compliance_risk(i["crew_id"], d),
            "generate_port_briefing":     lambda i, d: self.generate_compliance_briefing(i["vessel_id"], i["port_name"], d),
            "recommend_crew_for_position": lambda i, d: self.generate_crew_matching_recommendations(i["vessel_id"], i["position"], d),
            "analyze_crew_pool":          lambda i, d: self.analyze_crew_pool(d),
            # Knowledge tools — return query so Claude answers from training
            "lookup_stcw_requirement":    lambda i, d: {"source": "claude_knowledge", "query": i},
            "lookup_mlc_requirement":     lambda i, d: {"source": "claude_knowledge", "query": i},
            "get_watchkeeping_requirements": lambda i, d: {"source": "claude_knowledge", "query": i},
        }
        handler = dispatch.get(name)
        if not handler:
            return {"error": f"Unknown tool: {name}"}
        try:
            return handler(inputs, db)
        except Exception as exc:
            return {"error": str(exc)}

    # ── DB Query Tool Implementations ─────────────────────────────────────────

    def _tool_search_crew(self, inputs: dict, db: Session) -> dict:
        query = db.query(models.Crew)
        if inputs.get("query"):
            query = query.filter(models.Crew.name.ilike(f"%{inputs['query']}%"))
        if inputs.get("status"):
            query = query.filter(models.Crew.status == inputs["status"])
        if inputs.get("position"):
            query = query.filter(models.Crew.position.ilike(f"%{inputs['position']}%"))
        if inputs.get("nationality"):
            query = query.filter(models.Crew.nationality.ilike(f"%{inputs['nationality']}%"))
        # Newest first — makes "most recent" questions work naturally
        query = query.order_by(models.Crew.created_at.desc())
        crew = query.limit(20).all()
        return {
            "count": len(crew),
            "crew": [
                {
                    "id": c.id, "name": c.name, "position": c.position,
                    "status": c.status, "nationality": c.nationality,
                    "employee_id": c.employee_id, "added": str(c.created_at),
                }
                for c in crew
            ],
        }

    def _tool_get_crew_profile(self, inputs: dict, db: Session) -> dict:
        crew_id = inputs["crew_id"]
        crew = db.query(models.Crew).filter(models.Crew.id == crew_id).first()
        if not crew:
            return {"error": f"Crew member {crew_id} not found"}
        certs = db.query(models.Certificate).filter(models.Certificate.crew_id == crew_id).all()
        alerts = db.query(models.Alert).filter(
            models.Alert.crew_id == crew_id, models.Alert.resolved == False
        ).all()
        assignments = db.query(models.CrewAssignment).filter(
            models.CrewAssignment.crew_id == crew_id
        ).limit(5).all()
        return {
            "id": crew.id, "name": crew.name, "employee_id": crew.employee_id,
            "position": crew.position, "status": crew.status,
            "nationality": crew.nationality, "email": crew.email, "phone": crew.phone,
            "certificates": [
                {"id": c.id, "type": c.certificate_type,
                 "expiry": str(c.expiry_date), "issue": str(c.issue_date),
                 "authority": c.issuing_authority}
                for c in certs
            ],
            "active_alerts": [
                {"type": a.alert_type, "severity": a.severity, "message": a.message}
                for a in alerts
            ],
            "recent_assignments": [
                {"vessel_id": a.vessel_id, "position": a.position, "status": a.status}
                for a in assignments
            ],
        }

    def _tool_get_expiring_certificates(self, inputs: dict, db: Session) -> dict:
        days = inputs.get("days_ahead", 90)
        cutoff = datetime.utcnow().date() + timedelta(days=days)
        query = db.query(models.Certificate).filter(
            models.Certificate.expiry_date <= cutoff,
            models.Certificate.expiry_date >= datetime.utcnow().date(),
        )
        if inputs.get("crew_id"):
            query = query.filter(models.Certificate.crew_id == inputs["crew_id"])
        certs = query.order_by(models.Certificate.expiry_date).limit(50).all()
        results = []
        for c in certs:
            days_left = (c.expiry_date - datetime.utcnow().date()).days
            crew = db.query(models.Crew).filter(models.Crew.id == c.crew_id).first()
            results.append({
                "cert_id": c.id, "type": c.certificate_type,
                "expiry": str(c.expiry_date), "days_remaining": days_left,
                "crew_id": c.crew_id,
                "crew_name": crew.name if crew else "Unknown",
            })
        return {"count": len(results), "days_ahead": days, "expiring": results}

    def _tool_get_available_crew(self, inputs: dict, db: Session) -> dict:
        query = db.query(models.Crew).filter(models.Crew.status == "available")
        if inputs.get("position"):
            query = query.filter(models.Crew.position.ilike(f"%{inputs['position']}%"))
        crew = query.limit(30).all()
        return {
            "count": len(crew),
            "crew": [
                {"id": c.id, "name": c.name, "position": c.position, "nationality": c.nationality}
                for c in crew
            ],
        }

    def _tool_get_active_alerts(self, inputs: dict, db: Session) -> dict:
        query = db.query(models.Alert).filter(models.Alert.resolved == False)
        if inputs.get("severity"):
            query = query.filter(models.Alert.severity == inputs["severity"])
        if inputs.get("crew_id"):
            query = query.filter(models.Alert.crew_id == inputs["crew_id"])
        alerts = query.order_by(models.Alert.created_at.desc()).limit(30).all()
        results = []
        for a in alerts:
            crew = db.query(models.Crew).filter(models.Crew.id == a.crew_id).first()
            results.append({
                "id": a.id, "type": a.alert_type, "severity": a.severity,
                "message": a.message, "crew_id": a.crew_id,
                "crew_name": crew.name if crew else "Unknown",
                "created_at": str(a.created_at),
            })
        return {"count": len(results), "alerts": results}

    def _tool_fleet_summary(self, inputs: dict, db: Session) -> dict:
        total = db.query(models.Crew).count()
        available = db.query(models.Crew).filter(models.Crew.status == "available").count()
        onboard = db.query(models.Crew).filter(models.Crew.status == "onboard").count()
        total_certs = db.query(models.Certificate).count()
        cutoff_90 = datetime.utcnow().date() + timedelta(days=90)
        expiring_90 = db.query(models.Certificate).filter(
            models.Certificate.expiry_date <= cutoff_90,
            models.Certificate.expiry_date >= datetime.utcnow().date(),
        ).count()
        open_alerts = db.query(models.Alert).filter(models.Alert.resolved == False).count()
        high_alerts = db.query(models.Alert).filter(
            models.Alert.resolved == False, models.Alert.severity == "high"
        ).count()
        return {
            "crew": {"total": total, "available": available, "onboard": onboard,
                     "other": total - available - onboard},
            "certificates": {"total": total_certs, "expiring_90_days": expiring_90,
                             "valid": total_certs - expiring_90},
            "alerts": {"open": open_alerts, "high_severity": high_alerts},
            "utilization_pct": round((onboard / total * 100) if total else 0, 1),
        }

    def _tool_vessel_manifest(self, inputs: dict, db: Session) -> dict:
        vessel_id = inputs["vessel_id"]
        vessel = db.query(models.Vessel).filter(models.Vessel.id == vessel_id).first()
        if not vessel:
            return {"error": f"Vessel {vessel_id} not found"}
        assignments = db.query(models.CrewAssignment).filter(
            models.CrewAssignment.vessel_id == vessel_id,
            models.CrewAssignment.status == "active",
        ).all()
        manifest = []
        for a in assignments:
            crew = db.query(models.Crew).filter(models.Crew.id == a.crew_id).first()
            if crew:
                manifest.append({
                    "crew_id": crew.id, "name": crew.name,
                    "position": a.position, "nationality": crew.nationality,
                    "assignment_date": str(a.assignment_date),
                })
        return {
            "vessel_id": vessel.id, "vessel_name": vessel.name,
            "imo": vessel.imo, "vessel_type": vessel.vessel_type,
            "flag_state": vessel.flag_state,
            "crew_count": len(manifest), "manifest": manifest,
        }

    def _tool_search_certificates(self, inputs: dict, db: Session) -> dict:
        query = db.query(models.Certificate)
        if inputs.get("certificate_type"):
            query = query.filter(
                models.Certificate.certificate_type.ilike(f"%{inputs['certificate_type']}%")
            )
        if inputs.get("crew_id"):
            query = query.filter(models.Certificate.crew_id == inputs["crew_id"])
        certs = query.limit(30).all()
        results = []
        for c in certs:
            crew = db.query(models.Crew).filter(models.Crew.id == c.crew_id).first()
            days_left = (c.expiry_date - datetime.utcnow().date()).days
            results.append({
                "id": c.id, "type": c.certificate_type,
                "crew_id": c.crew_id, "crew_name": crew.name if crew else "Unknown",
                "expiry": str(c.expiry_date), "days_remaining": days_left,
                "authority": c.issuing_authority,
                "status": "expired" if days_left < 0 else ("expiring_soon" if days_left <= 90 else "valid"),
            })
        return {"count": len(results), "certificates": results}

    def _tool_get_assignments(self, inputs: dict, db: Session) -> dict:
        query = db.query(models.CrewAssignment)
        if inputs.get("crew_id"):
            query = query.filter(models.CrewAssignment.crew_id == inputs["crew_id"])
        if inputs.get("vessel_id"):
            query = query.filter(models.CrewAssignment.vessel_id == inputs["vessel_id"])
        if inputs.get("status"):
            query = query.filter(models.CrewAssignment.status == inputs["status"])
        assignments = query.limit(20).all()
        results = []
        for a in assignments:
            crew = db.query(models.Crew).filter(models.Crew.id == a.crew_id).first()
            vessel = db.query(models.Vessel).filter(models.Vessel.id == a.vessel_id).first()
            results.append({
                "id": a.id, "crew_id": a.crew_id,
                "crew_name": crew.name if crew else "Unknown",
                "vessel_id": a.vessel_id,
                "vessel_name": vessel.name if vessel else "Unknown",
                "position": a.position, "status": a.status,
                "assignment_date": str(a.assignment_date),
            })
        return {"count": len(results), "assignments": results}

    # ── Original Prompt-Based Methods (preserved) ─────────────────────────────

    def parse_certificate_document(self, document_text: str, document_type: str) -> Dict:
        """Extract structured data from maritime certificates using Claude vision/text"""
        prompt = f"""Analyze this maritime document and extract key information.

Document Type: {document_type}
Document Content:
{document_text}

Extract and return as JSON:
{{
    "document_type": "detected type",
    "holder_name": "person name",
    "certificate_number": "cert number",
    "issue_date": "YYYY-MM-DD",
    "expiry_date": "YYYY-MM-DD",
    "issuing_authority": "authority name",
    "ratings": ["list", "of", "ratings"],
    "endorsements": ["list", "of", "endorsements"],
    "validity_status": "valid|expired|expiring_soon",
    "confidence_score": 0.95,
    "extracted_fields": ["list of successfully extracted fields"],
    "missing_fields": ["list of fields not found"]
}}"""

        message = self.client.messages.create(
            model=self.model,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        try:
            return json.loads(message.content[0].text)
        except Exception:
            return {"raw_response": message.content[0].text}

    def parse_certificate_image(self, image_bytes: bytes, media_type: str) -> Dict:
        """Use Claude vision to extract certificate fields from a photo or scan."""
        import base64
        b64 = base64.standard_b64encode(image_bytes).decode("utf-8")
        response = self.client.messages.create(
            model=self.model,
            max_tokens=512,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": b64,
                        },
                    },
                    {
                        "type": "text",
                        "text": (
                            "This is a maritime certificate or seafarer document image. "
                            "Extract the certificate information and return ONLY a JSON object "
                            "with no other text, markdown, or explanation:\n"
                            "{\n"
                            '  "certificate_type": "full official certificate name (e.g. STCW Basic Safety Training (VI/1))",\n'
                            '  "issue_date": "YYYY-MM-DD or null if not visible",\n'
                            '  "expiry_date": "YYYY-MM-DD or null if not visible",\n'
                            '  "issuing_authority": "name of the issuing organisation or null",\n'
                            '  "confidence": "high if text is clearly readable, medium if partially readable, low if unclear"\n'
                            "}"
                        ),
                    },
                ],
            }],
        )
        text = response.content[0].text.strip()
        if text.startswith("```"):
            parts = text.split("```")
            text = parts[1] if len(parts) > 1 else text
            if text.lower().startswith("json"):
                text = text[4:]
        return json.loads(text.strip())

    def check_regulatory_compliance(self, crew_id: int, db: Session) -> Dict:
        """Verify crew against STCW, MLC, SOLAS, IMO GISIS regulations"""
        crew = db.query(models.Crew).filter(models.Crew.id == crew_id).first()
        if not crew:
            return {"error": "Crew not found"}

        certificates = db.query(models.Certificate).filter(
            models.Certificate.crew_id == crew_id
        ).all()

        cert_summary = "\n".join([
            f"- {c.certificate_type}: expires {c.expiry_date} (issued by {c.issuing_authority})"
            for c in certificates
        ])

        prompt = f"""Check maritime regulatory compliance for:

Crew Member: {crew.name}
Position: {crew.position}
Nationality: {crew.nationality}

Current Certificates:
{cert_summary if cert_summary else "No certificates on file"}

Verify compliance with STCW, MLC 2006, SOLAS, and IMO regulations.

Return as JSON:
{{
    "crew_id": {crew_id},
    "crew_name": "{crew.name}",
    "position": "{crew.position}",
    "overall_compliant": true,
    "stcw_compliant": true,
    "mlc_compliant": true,
    "solas_compliant": true,
    "compliance_gaps": [],
    "expiring_soon": [],
    "recommendations": [],
    "risk_level": "low|medium|high",
    "confidence_score": 0.88
}}"""

        message = self.client.messages.create(
            model=self.model,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        try:
            return json.loads(message.content[0].text)
        except Exception:
            return {"raw_response": message.content[0].text}

    def generate_crew_matching_recommendations(self, vessel_id: int, position: str, db: Session) -> Dict:
        """AI crew matching — recommend best crew for vessel positions"""
        vessel = db.query(models.Vessel).filter(models.Vessel.id == vessel_id).first()
        available_crew = db.query(models.Crew).filter(models.Crew.status == "available").all()

        crew_list = "\n".join([
            f"- {c.name} ({c.employee_id}): {c.position}, Status: {c.status}"
            for c in available_crew[:20]
        ])

        prompt = f"""Recommend the best crew members for:

Vessel: {vessel.name if vessel else "Unknown"} ({vessel.vessel_type if vessel else ""})
Position to Fill: {position}

Available Crew:
{crew_list if crew_list else "No crew available"}

Return as JSON:
{{
    "vessel_id": {vessel_id},
    "position": "{position}",
    "recommendations": [
        {{
            "crew_id": 1,
            "crew_name": "John Doe",
            "match_score": 0.92,
            "position_match": "exact",
            "reasons": [],
            "considerations": []
        }}
    ],
    "matching_algorithm": "claude-ai-v1",
    "generated_at": "{datetime.utcnow().isoformat()}"
}}"""

        message = self.client.messages.create(
            model=self.model,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        try:
            return json.loads(message.content[0].text)
        except Exception:
            return {"raw_response": message.content[0].text}

    def generate_compliance_briefing(self, vessel_id: int, port_name: str, db: Session) -> Dict:
        """Generate port arrival briefing with compliance requirements"""
        vessel = db.query(models.Vessel).filter(models.Vessel.id == vessel_id).first()

        prompt = f"""Generate a maritime compliance briefing for port arrival.

Vessel: {vessel.name if vessel else "Unknown"}
Vessel Type: {vessel.vessel_type if vessel else "Unknown"}
Flag State: {vessel.flag_state if vessel else "Unknown"}
Port of Call: {port_name}

Cover: PSC requirements, STCW crew documentation, MLC checklist, SOLAS safety, environmental regulations.

Return as JSON:
{{
    "vessel_id": {vessel_id},
    "port_name": "{port_name}",
    "briefing": "Detailed markdown formatted briefing",
    "critical_items": [],
    "documents_required": [],
    "estimated_time_to_comply": "in hours",
    "psc_inspection_risk": "low|medium|high",
    "generated_at": "{datetime.utcnow().isoformat()}"
}}"""

        message = self.client.messages.create(
            model=self.model,
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}],
        )
        try:
            return json.loads(message.content[0].text)
        except Exception:
            return {"raw_response": message.content[0].text}

    def assess_compliance_risk(self, crew_id: int, db: Session) -> Dict:
        """Predictive risk assessment for crew compliance"""
        crew = db.query(models.Crew).filter(models.Crew.id == crew_id).first()
        if not crew:
            return {"error": "Crew not found"}

        certificates = db.query(models.Certificate).filter(
            models.Certificate.crew_id == crew_id
        ).all()

        cert_data = "\n".join([
            f"- {c.certificate_type}: expires {c.expiry_date}"
            for c in certificates
        ])

        prompt = f"""Assess compliance risk for crew member.

Crew: {crew.name}
Position: {crew.position}
Current Certificates:
{cert_data}

Return as JSON:
{{
    "crew_id": {crew_id},
    "overall_risk_score": 0.35,
    "risk_level": "low|medium|high",
    "risk_factors": [
        {{"factor": "Certificate expiring", "severity": "high", "timeline": "30 days"}}
    ],
    "time_until_non_compliant": "90 days",
    "recommended_actions": [],
    "confidence": 0.85,
    "assessment_date": "{datetime.utcnow().isoformat()}"
}}"""

        message = self.client.messages.create(
            model=self.model,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        try:
            return json.loads(message.content[0].text)
        except Exception:
            return {"raw_response": message.content[0].text}

    def analyze_crew_pool(self, db: Session) -> Dict:
        """Strategic crew pool analysis and capacity planning"""
        total_crew = db.query(models.Crew).count()
        available = db.query(models.Crew).filter(models.Crew.status == "available").count()
        onboard = db.query(models.Crew).filter(models.Crew.status == "onboard").count()

        crew_by_position = db.query(
            models.Crew.position,
            models.Crew.status,
        ).group_by(models.Crew.position, models.Crew.status).all()

        position_summary = "\n".join([f"- {pos}: {status}" for pos, status in crew_by_position])

        prompt = f"""Analyze maritime crew pool for strategic workforce planning.

Total Crew: {total_crew}
Available: {available}
Onboard: {onboard}

Position Distribution:
{position_summary}

Return as JSON:
{{
    "total_crew": {total_crew},
    "available_crew": {available},
    "onboard_crew": {onboard},
    "utilization_rate": 0.65,
    "capacity_vs_demand": "understaffed|optimal|overstaffed",
    "critical_gaps": [],
    "position_analysis": {{}},
    "expiring_certifications_90_days": 0,
    "recommendations": [],
    "hiring_priorities": [],
    "analysis_date": "{datetime.utcnow().isoformat()}"
}}"""

        message = self.client.messages.create(
            model=self.model,
            max_tokens=1536,
            messages=[{"role": "user", "content": prompt}],
        )
        try:
            return json.loads(message.content[0].text)
        except Exception:
            return {"raw_response": message.content[0].text}


# Initialize singleton service
ai_service = MarineAIService()
