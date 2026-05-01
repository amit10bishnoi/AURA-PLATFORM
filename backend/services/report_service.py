import io
from datetime import datetime
from typing import List, Optional

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.enums import TA_CENTER
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False
    print("⚠️  reportlab not installed — PDF generation disabled")


def generate_board_report(org_name, tenant_name, risk_score, nist_pct, iso_pct,
                          implemented_controls, total_controls, financial_exposure,
                          assessment_history, tasks, generated_by) -> bytes:
    if not REPORTLAB_AVAILABLE:
        raise RuntimeError("Install reportlab: pip install reportlab")

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            rightMargin=50, leftMargin=50,
                            topMargin=50, bottomMargin=50)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle("T", parent=styles["Heading1"], fontSize=22,
                                 textColor=colors.HexColor("#DC322F"), alignment=TA_CENTER,
                                 spaceAfter=6)
    sub_style   = ParagraphStyle("S", parent=styles["Normal"],   fontSize=11,
                                 textColor=colors.HexColor("#666666"), alignment=TA_CENTER,
                                 spaceAfter=20)
    h2_style    = ParagraphStyle("H2", parent=styles["Heading2"], fontSize=13,
                                 spaceBefore=18, spaceAfter=8)

    risk_level = ("CRITICAL" if risk_score >= 75 else
                  "HIGH"     if risk_score >= 50 else
                  "MEDIUM"   if risk_score >= 25 else "LOW")

    story = [
        Paragraph("AURA Security Platform", title_style),
        Paragraph("Board Executive Report", sub_style),
        Paragraph(f"Organization: {org_name}" + (f" ({tenant_name})" if tenant_name else ""), sub_style),
        Paragraph(f"Generated: {datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')}", sub_style),
        Spacer(1, 10),
        Paragraph("Executive Summary", h2_style),
    ]

    summary_data = [
        ["Metric", "Value", "Status"],
        ["Overall Risk Score",       f"{risk_score:.0f}/100",            risk_level],
        ["NIST CSF Compliance",      f"{nist_pct}%",                     "Compliant" if nist_pct >= 80 else "Partial"],
        ["ISO 27001 Compliance",     f"{iso_pct}%",                      "Compliant" if iso_pct  >= 80 else "Partial"],
        ["Controls Implemented",     f"{implemented_controls}/{total_controls}",
                                     f"{round(implemented_controls/max(total_controls,1)*100)}%"],
        ["Estimated Annual Exposure", f"${financial_exposure:,.0f}",     "FAIR Model"],
    ]

    tbl = Table(summary_data, colWidths=[200, 150, 100])
    tbl.setStyle(TableStyle([
        ("BACKGROUND",   (0,0), (-1,0), colors.HexColor("#13172A")),
        ("TEXTCOLOR",    (0,0), (-1,0), colors.white),
        ("FONTNAME",     (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",     (0,0), (-1,-1), 9),
        ("BACKGROUND",   (0,1), (-1,-1), colors.HexColor("#F8F9FA")),
        ("GRID",         (0,0), (-1,-1), 0.5, colors.HexColor("#DDDDDD")),
        ("TOPPADDING",   (0,0), (-1,-1), 7),
        ("BOTTOMPADDING",(0,0), (-1,-1), 7),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 16))

    # Assessment history
    if assessment_history:
        story.append(Paragraph("Assessment History (last 5)", h2_style))
        hdr = [["Date", "Organization", "Risk Score", "Level", "Exposure"]]
        rows = []
        for item in assessment_history[-5:]:
            rows.append([
                str(item.get("created_at", ""))[:10],
                str(item.get("org_name", ""))[:30],
                f"{item.get('risk_score', 0):.1f}",
                item.get("risk_level", ""),
                f"${item.get('financial_exposure', 0):,.0f}",
            ])
        ht = Table(hdr + rows, colWidths=[80, 150, 70, 70, 80])
        ht.setStyle(TableStyle([
            ("BACKGROUND",   (0,0), (-1,0), colors.HexColor("#6366F1")),
            ("TEXTCOLOR",    (0,0), (-1,0), colors.white),
            ("FONTNAME",     (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE",     (0,0), (-1,-1), 8),
            ("GRID",         (0,0), (-1,-1), 0.5, colors.HexColor("#DDDDDD")),
            ("TOPPADDING",   (0,0), (-1,-1), 5),
            ("BOTTOMPADDING",(0,0), (-1,-1), 5),
        ]))
        story.append(ht)
        story.append(Spacer(1, 16))

    # Open tasks
    open_tasks = [t for t in tasks if t.get("status") != "done"][:10]
    if open_tasks:
        story.append(Paragraph("Open Remediation Tasks", h2_style))
        th = [["Priority", "Task", "Status", "Due"]]
        tr = [[t.get("priority",""), t.get("title","")[:50],
               t.get("status",""), t.get("due","") or "—"] for t in open_tasks]
        tt = Table(th + tr, colWidths=[60, 260, 70, 60])
        tt.setStyle(TableStyle([
            ("BACKGROUND",   (0,0), (-1,0), colors.HexColor("#DC322F")),
            ("TEXTCOLOR",    (0,0), (-1,0), colors.white),
            ("FONTNAME",     (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE",     (0,0), (-1,-1), 8),
            ("GRID",         (0,0), (-1,-1), 0.5, colors.HexColor("#DDDDDD")),
            ("TOPPADDING",   (0,0), (-1,-1), 5),
            ("BOTTOMPADDING",(0,0), (-1,-1), 5),
        ]))
        story.append(tt)
        story.append(Spacer(1, 20))

    footer_style = ParagraphStyle("F", parent=styles["Normal"], fontSize=9,
                                  textColor=colors.HexColor("#999999"))
    story.append(Paragraph(f"Report generated by: {generated_by}", footer_style))
    story.append(Paragraph("AURA — AI-Powered Unified Risk & Audit Platform", footer_style))

    doc.build(story)
    buf.seek(0)
    return buf.read()