from io import BytesIO
from datetime import datetime, timedelta

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table,
    TableStyle, HRFlowable, PageBreak
)
from reportlab.graphics.shapes import Drawing, Rect, Line, String, Circle
from reportlab.graphics import renderPDF

PAGE_W, PAGE_H = A4
MARGIN = 18 * mm

C_RED    = colors.HexColor("#DC322F")
C_INDIGO = colors.HexColor("#6366F1")
C_GREEN  = colors.HexColor("#10B981")
C_AMBER  = colors.HexColor("#F59E0B")
C_YELLOW = colors.HexColor("#EAB308")
C_DARK   = colors.HexColor("#111827")
C_NAVY   = colors.HexColor("#080B14")
C_SLATE  = colors.HexColor("#94A3B8")
C_GRAY   = colors.HexColor("#F9FAFB")
C_MGRAY  = colors.HexColor("#E5E7EB")
C_DGRAY  = colors.HexColor("#6B7280")
C_WHITE  = colors.white


def _risk_color(level):
    return {
        "CRITICAL": C_RED,
        "HIGH":     C_AMBER,
        "MEDIUM":   C_YELLOW,
        "LOW":      C_GREEN,
    }.get(str(level).upper(), C_DGRAY)


def _risk_level(score):
    s = float(score)
    if s >= 75: return "CRITICAL"
    if s >= 50: return "HIGH"
    if s >= 25: return "MEDIUM"
    return "LOW"


def _s(name, **kw):
    base = dict(fontName="Helvetica", fontSize=9, textColor=C_DARK,
                leading=13, spaceAfter=0, spaceBefore=0)
    base.update(kw)
    return ParagraphStyle(name, **base)


def _fmt_date(iso_str):
    try:
        dt = datetime.fromisoformat(str(iso_str).replace("Z", "+00:00"))
        return dt.strftime("%d %b %Y")
    except Exception:
        return str(iso_str)[:10] if iso_str else "—"


def _progress_bar(value, total_width, color, height=7):
    pct   = max(0.0, min(1.0, value / 100.0))
    fill  = total_width * pct
    d     = Drawing(total_width, height)
    d.add(Rect(0, 0, total_width, height,
               fillColor=C_MGRAY, strokeColor=None))
    if fill > 0:
        d.add(Rect(0, 0, fill, height,
                   fillColor=color, strokeColor=None))
    return d


def _bar_chart(history, total_width):
    chart_h  = 55 * mm
    n        = min(len(history), 8)
    recent   = history[-n:]
    bar_zone = total_width - 28
    bar_each = bar_zone / n
    bar_pad  = bar_each * 0.18

    d = Drawing(total_width, chart_h)

    for v in [0, 25, 50, 75, 100]:
        y = 14 + (v / 100) * (chart_h - 22)
        d.add(Line(26, y, total_width, y,
                   strokeColor=C_MGRAY, strokeWidth=0.4))
        d.add(String(22, y - 3, str(v),
                     fontSize=6, fontName="Helvetica",
                     fillColor=C_DGRAY, textAnchor="end"))

    for i, rec in enumerate(recent):
        s   = float(rec.get("risk_score", 0))
        lvl = _risk_level(s)
        rc  = _risk_color(lvl)
        x   = 28 + i * bar_each
        bh  = (s / 100) * (chart_h - 22)

        d.add(Rect(x + bar_pad, 14, bar_each - bar_pad * 2, bh,
                   fillColor=rc, strokeColor=None))
        d.add(String(x + bar_each / 2, 14 + bh + 2, str(int(s)),
                     fontSize=6, fontName="Helvetica-Bold",
                     fillColor=rc, textAnchor="middle"))

        label = _fmt_date(rec.get("created_at", ""))[:6]
        d.add(String(x + bar_each / 2, 3, label,
                     fontSize=5.5, fontName="Helvetica",
                     fillColor=C_DGRAY, textAnchor="middle"))

    return d


def generate_board_report(data: dict) -> bytes:
    buf          = BytesIO()
    content_w    = PAGE_W - 2 * MARGIN
    org_name     = data.get("org_name", "Organisation")
    risk_score   = float(data.get("risk_score", 50))
    risk_lvl     = _risk_level(risk_score)
    r_color      = _risk_color(risk_lvl)
    nist_pct     = int(data.get("nist_pct", 0))
    iso_pct      = int(data.get("iso_pct", 0))
    impl         = int(data.get("implemented_controls", 0))
    total        = int(data.get("total_controls", 12))
    exposure     = int(data.get("financial_exposure", 0))
    generated_by = data.get("generated_by", "AURA Platform")
    history      = data.get("assessment_history", [])
    tasks        = data.get("tasks", [])
    generated    = ((datetime.utcnow() + timedelta(hours=5, minutes=30)) + timedelta(hours=5, minutes=30)).strftime("%d %B %Y")
    quarter      = f"Q{(((datetime.utcnow() + timedelta(hours=5, minutes=30)) + timedelta(hours=5, minutes=30)).month - 1) // 3 + 1} {((datetime.utcnow() + timedelta(hours=5, minutes=30)) + timedelta(hours=5, minutes=30)).year}"

    open_tasks  = [t for t in tasks if t.get("status") == "open"]
    in_prog     = [t for t in tasks if t.get("status") == "in-progress"]
    done_tasks  = [t for t in tasks if t.get("status") == "done"]

    def _add_page_number(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(C_DGRAY)
        canvas.drawRightString(
            PAGE_W - MARGIN, 10 * mm,
            f"AURA Platform  ·  Confidential  ·  Page {doc.page}"
        )
        canvas.drawString(
            MARGIN, 10 * mm,
            f"Board Risk Report  ·  {org_name}  ·  {generated}"
        )
        canvas.restoreState()

    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=MARGIN,  bottomMargin=20 * mm,
        title=f"AURA Board Risk Report — {org_name}",
        author="AURA Platform",
    )

    story = []

    cover_d = Drawing(content_w, 140)
    cover_d.add(Rect(0, 0, content_w, 140, fillColor=C_NAVY, strokeColor=None))
    cover_d.add(Rect(0, 136, content_w, 4,   fillColor=C_RED,  strokeColor=None))
    cover_d.add(String(20, 98,  "AURA",
                        fontSize=38, fontName="Helvetica-Bold",
                        fillColor=C_WHITE))
    cover_d.add(String(20, 80,  "AI-POWERED UNIFIED RISK & AUDIT",
                        fontSize=8,  fontName="Helvetica",
                        fillColor=C_SLATE))
    cover_d.add(Line(20, 72, content_w - 20, 72,
                     strokeColor=C_RED, strokeWidth=1))
    cover_d.add(String(20, 52, "Board Risk Report",
                        fontSize=18, fontName="Helvetica-Bold",
                        fillColor=C_WHITE))
    cover_d.add(String(20, 36, org_name,
                        fontSize=13, fontName="Helvetica",
                        fillColor=colors.HexColor("#A5B4FC")))
    cover_d.add(String(20, 18, f"{quarter}  ·  {generated}",
                        fontSize=8,  fontName="Helvetica",
                        fillColor=C_SLATE))

    risk_label = f"RISK: {risk_lvl}"
    cover_d.add(Rect(content_w - 120, 18, 110, 24,
                     fillColor=r_color, strokeColor=None))
    cover_d.add(String(content_w - 65, 27, risk_label,
                        fontSize=9, fontName="Helvetica-Bold",
                        fillColor=C_WHITE, textAnchor="middle"))

    story.append(cover_d)
    story.append(Spacer(1, 7 * mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=C_MGRAY))
    story.append(Spacer(1, 6 * mm))

    story.append(Paragraph("Executive Summary", _s("h2",
        fontName="Helvetica-Bold", fontSize=13, textColor=C_DARK, leading=17,
        spaceAfter=4)))
    story.append(Spacer(1, 3 * mm))

    kpi_rows = [[
        Paragraph(str(int(risk_score)),
            _s("kv1", fontName="Helvetica-Bold", fontSize=26,
               textColor=r_color, leading=30, alignment=TA_CENTER)),
        Paragraph(f"{impl}/{total}",
            _s("kv2", fontName="Helvetica-Bold", fontSize=20,
               textColor=C_GREEN, leading=24, alignment=TA_CENTER)),
        Paragraph(f"{nist_pct}%",
            _s("kv3", fontName="Helvetica-Bold", fontSize=20,
               textColor=C_INDIGO, leading=24, alignment=TA_CENTER)),
        Paragraph(f"${exposure:,}",
            _s("kv4", fontName="Helvetica-Bold", fontSize=14,
               textColor=C_AMBER, leading=18, alignment=TA_CENTER)),
    ], [
        Paragraph("Risk Score",             _s("kl1", fontSize=7, textColor=C_DGRAY, alignment=TA_CENTER)),
        Paragraph("Controls Implemented",   _s("kl2", fontSize=7, textColor=C_DGRAY, alignment=TA_CENTER)),
        Paragraph("NIST CSF Compliance",    _s("kl3", fontSize=7, textColor=C_DGRAY, alignment=TA_CENTER)),
        Paragraph("FAIR Exposure Est.",     _s("kl4", fontSize=7, textColor=C_DGRAY, alignment=TA_CENTER)),
    ]]

    kpi_t = Table(kpi_rows,
                  colWidths=[content_w / 4] * 4,
                  rowHeights=[22 * mm, 7 * mm])
    kpi_t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), C_GRAY),
        ("LINEAFTER",     (0, 0), (2, -1),  0.5, C_MGRAY),
        ("LINEBELOW",     (0, 0), (0,  0),  2.5, r_color),
        ("LINEBELOW",     (1, 0), (1,  0),  2.5, C_GREEN),
        ("LINEBELOW",     (2, 0), (2,  0),  2.5, C_INDIGO),
        ("LINEBELOW",     (3, 0), (3,  0),  2.5, C_AMBER),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(kpi_t)
    story.append(Spacer(1, 8 * mm))

    story.append(Paragraph("Compliance Status", _s("h2b",
        fontName="Helvetica-Bold", fontSize=13, textColor=C_DARK,
        leading=17, spaceAfter=4)))
    story.append(Spacer(1, 3 * mm))

    for fw_name, fw_pct, fw_color in [
        ("NIST CSF 2.0",   nist_pct, C_INDIGO),
        ("ISO 27001:2022", iso_pct,  C_GREEN),
    ]:
        fw_status = "Compliant" if fw_pct >= 80 else ("Partial" if fw_pct >= 50 else "Non-Compliant")
        fw_sc     = C_GREEN    if fw_pct >= 80 else (C_AMBER   if fw_pct >= 50 else C_RED)

        header_row = Table([[
            Paragraph(f"<b>{fw_name}</b>",
                _s("fwn", fontSize=10, textColor=C_DARK)),
            Paragraph(f"● {fw_status}",
                _s("fwst", fontSize=8, textColor=fw_sc)),
            Paragraph(f"<b>{fw_pct}%</b>",
                _s("fwp", fontName="Helvetica-Bold", fontSize=13,
                   textColor=fw_color, alignment=TA_RIGHT)),
        ]], colWidths=[content_w * 0.45, content_w * 0.35, content_w * 0.20])
        header_row.setStyle(TableStyle([
            ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING",    (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        story.append(header_row)
        story.append(_progress_bar(fw_pct, content_w, fw_color))
        story.append(Spacer(1, 5 * mm))

    story.append(Spacer(1, 3 * mm))

    if len(history) >= 2:
        story.append(Paragraph("Risk Score Trend", _s("h2c",
            fontName="Helvetica-Bold", fontSize=13, textColor=C_DARK,
            leading=17, spaceAfter=4)))
        story.append(Spacer(1, 3 * mm))
        story.append(_bar_chart(history, content_w))
        story.append(Spacer(1, 3 * mm))

        latest = float(history[-1].get("risk_score", 0))
        prev   = float(history[-2].get("risk_score", 0))
        delta  = latest - prev

        if delta < 0:
            trend = f"▼ Risk score improved by {abs(delta):.1f} points since last assessment."
            tc    = C_GREEN
        elif delta > 0:
            trend = f"▲ Risk score worsened by {delta:.1f} points since last assessment."
            tc    = C_RED
        else:
            trend = "→ Risk score is stable since last assessment."
            tc    = C_AMBER

        story.append(Paragraph(trend, _s("trnd", fontSize=8, textColor=tc)))
        story.append(Spacer(1, 7 * mm))

    story.append(Paragraph("Remediation Workflow", _s("h2d",
        fontName="Helvetica-Bold", fontSize=13, textColor=C_DARK,
        leading=17, spaceAfter=4)))
    story.append(Spacer(1, 3 * mm))

    sum_rows = [[
        Paragraph(f"<b>{len(open_tasks)}</b>",
            _s("sv1", fontName="Helvetica-Bold", fontSize=20, textColor=C_RED,   alignment=TA_CENTER, leading=24)),
        Paragraph(f"<b>{len(in_prog)}</b>",
            _s("sv2", fontName="Helvetica-Bold", fontSize=20, textColor=C_AMBER, alignment=TA_CENTER, leading=24)),
        Paragraph(f"<b>{len(done_tasks)}</b>",
            _s("sv3", fontName="Helvetica-Bold", fontSize=20, textColor=C_GREEN, alignment=TA_CENTER, leading=24)),
        Paragraph(f"<b>{len(tasks)}</b>",
            _s("sv4", fontName="Helvetica-Bold", fontSize=20, textColor=C_DGRAY, alignment=TA_CENTER, leading=24)),
    ], [
        Paragraph("Open",        _s("sl1", fontSize=7, textColor=C_DGRAY, alignment=TA_CENTER)),
        Paragraph("In Progress", _s("sl2", fontSize=7, textColor=C_DGRAY, alignment=TA_CENTER)),
        Paragraph("Completed",   _s("sl3", fontSize=7, textColor=C_DGRAY, alignment=TA_CENTER)),
        Paragraph("Total",       _s("sl4", fontSize=7, textColor=C_DGRAY, alignment=TA_CENTER)),
    ]]

    sum_t = Table(sum_rows,
                  colWidths=[content_w / 4] * 4,
                  rowHeights=[18 * mm, 7 * mm])
    sum_t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (0, -1), colors.HexColor("#FEE2E2")),
        ("BACKGROUND",    (1, 0), (1, -1), colors.HexColor("#FEF3C7")),
        ("BACKGROUND",    (2, 0), (2, -1), colors.HexColor("#D1FAE5")),
        ("BACKGROUND",    (3, 0), (3, -1), C_GRAY),
        ("LINEAFTER",     (0, 0), (2, -1), 0.5, C_MGRAY),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(sum_t)
    story.append(Spacer(1, 5 * mm))

    active_tasks = open_tasks + in_prog
    if active_tasks:
        story.append(Paragraph("Open & In-Progress Tasks",
            _s("h3a", fontName="Helvetica-Bold", fontSize=10,
               textColor=C_DARK, leading=14, spaceAfter=3)))
        story.append(Spacer(1, 2 * mm))

        t_header = [
            Paragraph("Task",     _s("th0", fontName="Helvetica-Bold", fontSize=8, textColor=C_WHITE)),
            Paragraph("Priority", _s("th1", fontName="Helvetica-Bold", fontSize=8, textColor=C_WHITE, alignment=TA_CENTER)),
            Paragraph("Status",   _s("th2", fontName="Helvetica-Bold", fontSize=8, textColor=C_WHITE, alignment=TA_CENTER)),
            Paragraph("Assignee", _s("th3", fontName="Helvetica-Bold", fontSize=8, textColor=C_WHITE)),
            Paragraph("Due",      _s("th4", fontName="Helvetica-Bold", fontSize=8, textColor=C_WHITE, alignment=TA_CENTER)),
        ]
        t_rows = [t_header]

        for idx, t in enumerate(active_tasks[:15]):
            prio = str(t.get("priority", "MEDIUM")).upper()
            pc   = _risk_color(prio)
            stat = str(t.get("status", "open")).replace("-", " ").title()
            sc   = C_AMBER if "progress" in stat.lower() else C_RED

            t_rows.append([
                Paragraph((t.get("title") or "")[:70], _s(f"td0{idx}", fontSize=8, textColor=C_DARK)),
                Paragraph(prio, _s(f"td1{idx}", fontName="Helvetica-Bold", fontSize=7, textColor=pc, alignment=TA_CENTER)),
                Paragraph(stat, _s(f"td2{idx}", fontSize=7, textColor=sc, alignment=TA_CENTER)),
                Paragraph((t.get("assignee") or "Unassigned")[:22], _s(f"td3{idx}", fontSize=7, textColor=C_DGRAY)),
                Paragraph(t.get("due") or "—", _s(f"td4{idx}", fontSize=7, textColor=C_DGRAY, alignment=TA_CENTER)),
            ])

        task_t = Table(t_rows, colWidths=[
            content_w * 0.42,
            content_w * 0.12,
            content_w * 0.14,
            content_w * 0.19,
            content_w * 0.13,
        ])

        ts = [
            ("BACKGROUND",    (0, 0), (-1, 0),  C_NAVY),
            ("GRID",          (0, 0), (-1, -1),  0.3, C_MGRAY),
            ("VALIGN",        (0, 0), (-1, -1),  "MIDDLE"),
            ("TOPPADDING",    (0, 0), (-1, -1),  4),
            ("BOTTOMPADDING", (0, 0), (-1, -1),  4),
            ("LEFTPADDING",   (0, 0), (-1, -1),  5),
            ("RIGHTPADDING",  (0, 0), (-1, -1),  4),
        ]
        for idx in range(1, len(t_rows)):
            ts.append(("BACKGROUND", (0, idx), (-1, idx),
                        C_WHITE if idx % 2 == 1 else C_GRAY))

        task_t.setStyle(TableStyle(ts))
        story.append(task_t)
        story.append(Spacer(1, 7 * mm))

    if history:
        story.append(Paragraph("Assessment History", _s("h2e",
            fontName="Helvetica-Bold", fontSize=13, textColor=C_DARK,
            leading=17, spaceAfter=4)))
        story.append(Spacer(1, 3 * mm))

        h_header = [
            Paragraph("#",            _s("hh0", fontName="Helvetica-Bold", fontSize=8, textColor=C_WHITE, alignment=TA_CENTER)),
            Paragraph("Organisation", _s("hh1", fontName="Helvetica-Bold", fontSize=8, textColor=C_WHITE)),
            Paragraph("Industry",     _s("hh2", fontName="Helvetica-Bold", fontSize=8, textColor=C_WHITE)),
            Paragraph("Score",        _s("hh3", fontName="Helvetica-Bold", fontSize=8, textColor=C_WHITE, alignment=TA_CENTER)),
            Paragraph("Level",        _s("hh4", fontName="Helvetica-Bold", fontSize=8, textColor=C_WHITE, alignment=TA_CENTER)),
            Paragraph("Exposure",     _s("hh5", fontName="Helvetica-Bold", fontSize=8, textColor=C_WHITE, alignment=TA_RIGHT)),
            Paragraph("Date",         _s("hh6", fontName="Helvetica-Bold", fontSize=8, textColor=C_WHITE, alignment=TA_CENTER)),
        ]

        h_rows = [h_header]
        for idx, rec in enumerate(history[-10:]):
            lvl = str(rec.get("risk_level", "MEDIUM")).upper()
            rc  = _risk_color(lvl)
            s   = float(rec.get("risk_score", 0))
            exp = int(rec.get("financial_exposure") or 0)

            h_rows.append([
                Paragraph(str(idx + 1).zfill(2), _s(f"hd0{idx}", fontSize=8, textColor=C_DGRAY, alignment=TA_CENTER)),
                Paragraph(str(rec.get("org_name") or "—"), _s(f"hd1{idx}", fontSize=8, textColor=C_DARK)),
                Paragraph(str(rec.get("industry") or "—"), _s(f"hd2{idx}", fontSize=8, textColor=C_DGRAY)),
                Paragraph(str(int(s)), _s(f"hd3{idx}", fontName="Helvetica-Bold", fontSize=8, textColor=rc, alignment=TA_CENTER)),
                Paragraph(lvl,         _s(f"hd4{idx}", fontName="Helvetica-Bold", fontSize=7, textColor=rc, alignment=TA_CENTER)),
                Paragraph(f"${exp:,}", _s(f"hd5{idx}", fontSize=8, textColor=C_DGRAY, alignment=TA_RIGHT)),
                Paragraph(_fmt_date(rec.get("created_at")), _s(f"hd6{idx}", fontSize=8, textColor=C_DGRAY, alignment=TA_CENTER)),
            ])

        hist_t = Table(h_rows, colWidths=[
            content_w * 0.06,
            content_w * 0.22,
            content_w * 0.14,
            content_w * 0.10,
            content_w * 0.13,
            content_w * 0.17,
            content_w * 0.18,
        ])

        hs = [
            ("BACKGROUND",    (0, 0), (-1, 0),  C_NAVY),
            ("GRID",          (0, 0), (-1, -1),  0.3, C_MGRAY),
            ("VALIGN",        (0, 0), (-1, -1),  "MIDDLE"),
            ("TOPPADDING",    (0, 0), (-1, -1),  4),
            ("BOTTOMPADDING", (0, 0), (-1, -1),  4),
            ("LEFTPADDING",   (0, 0), (-1, -1),  5),
            ("RIGHTPADDING",  (0, 0), (-1, -1),  4),
        ]
        for idx in range(1, len(h_rows)):
            hs.append(("BACKGROUND", (0, idx), (-1, idx),
                        C_WHITE if idx % 2 == 1 else C_GRAY))

        hist_t.setStyle(TableStyle(hs))
        story.append(hist_t)
        story.append(Spacer(1, 7 * mm))

    story.append(HRFlowable(width="100%", thickness=0.5, color=C_MGRAY))
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph(
        f"This report was generated automatically by the AURA Platform on {generated} "
        f"and prepared by {generated_by}. Risk scores are based on NIST CSF 2.0 and "
        f"ISO 27001:2022 control implementation. Financial exposure estimates use "
        f"FAIR methodology baselines. This document is confidential and intended "
        f"for board-level review only.",
        _s("footer", fontSize=7, textColor=C_DGRAY, leading=10)
    ))

    doc.build(story, onFirstPage=_add_page_number, onLaterPages=_add_page_number)
    return buf.getvalue()