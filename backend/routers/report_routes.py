import io
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from schemas import BoardReportRequest
from dependencies import verify_proxy_key
from services.report_service import generate_board_report, REPORTLAB_AVAILABLE

router = APIRouter(prefix="/api/report", tags=["Reports"])


@router.post("/board")
async def board_report(
    data: BoardReportRequest,
    _: bool = Depends(verify_proxy_key),
):
    if not REPORTLAB_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="PDF generation unavailable. Run: pip install reportlab"
        )
    try:
        pdf = generate_board_report(
            org_name=data.org_name,
            tenant_name=data.tenant_name,
            risk_score=data.risk_score,
            nist_pct=data.nist_pct,
            iso_pct=data.iso_pct,
            implemented_controls=data.implemented_controls,
            total_controls=data.total_controls,
            financial_exposure=data.financial_exposure,
            assessment_history=data.assessment_history or [],
            tasks=data.tasks or [],
            generated_by=data.generated_by,
        )
        return StreamingResponse(
            io.BytesIO(pdf),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=AURA_Board_Report.pdf"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))