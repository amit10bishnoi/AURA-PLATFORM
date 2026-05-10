from fastapi import APIRouter, Request, HTTPException, Query
from datetime import datetime, timedelta
import os

billing_router = APIRouter(prefix="/api/billing", tags=["billing"])

PLANS = {
    "starter":    {"name":"Starter",    "price":49,  "price_id":"price_starter",    "features":["3 frameworks","5 users","10 integrations","Basic reports"],                                           "limits":{"frameworks":3,"users":5,"integrations":10}},
    "growth":     {"name":"Growth",     "price":149, "price_id":"price_growth",     "features":["8 frameworks","25 users","30 integrations","AI Assistant","Auditor Portal","Advanced reports"],       "limits":{"frameworks":8,"users":25,"integrations":30}},
    "enterprise": {"name":"Enterprise", "price":499, "price_id":"price_enterprise", "features":["Unlimited frameworks","Unlimited users","All integrations","White-labeling","SSO","Dedicated support"], "limits":{"frameworks":-1,"users":-1,"integrations":-1}},
}

DEMO_SUB = {"plan":"growth","status":"active","current_period_end":(datetime.utcnow()+timedelta(days=18)).isoformat(),"trial_end":None,"usage":{"frameworks":5,"users":7,"integrations":12}}

@billing_router.get("/plans")
def get_plans(): return {"plans": PLANS}

@billing_router.get("/subscription")
def get_subscription(tenant_id: str = Query(...)):
    return {"subscription": DEMO_SUB, "plan": PLANS[DEMO_SUB["plan"]]}

@billing_router.post("/checkout")
def create_checkout(body: dict, tenant_id: str = Query(...)):
    plan_id = body.get("plan","growth")
    STRIPE_SECRET = os.getenv("STRIPE_SECRET_KEY","")
    if STRIPE_SECRET:
        try:
            import stripe; stripe.api_key = STRIPE_SECRET
            session = stripe.checkout.Session.create(payment_method_types=["card"],line_items=[{"price":PLANS[plan_id]["price_id"],"quantity":1}],mode="subscription",success_url=f"{os.getenv('FRONTEND_URL','http://localhost:3000')}?billing=success",cancel_url=f"{os.getenv('FRONTEND_URL','http://localhost:3000')}?billing=cancel",metadata={"tenant_id":tenant_id})
            return {"checkout_url": session.url}
        except Exception as e:
            return {"error":str(e),"checkout_url":"#"}
    return {"message":"Configure STRIPE_SECRET_KEY in .env","plan":PLANS.get(plan_id),"checkout_url":"#"}

@billing_router.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature","")
    STRIPE_SECRET = os.getenv("STRIPE_SECRET_KEY","")
    WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET","")
    if STRIPE_SECRET and WEBHOOK_SECRET:
        try:
            import stripe
            event = stripe.Webhook.construct_event(payload, sig, WEBHOOK_SECRET)
            print(f"Stripe event: {event['type']}")
        except Exception as e:
            raise HTTPException(400, str(e))
    return {"received": True}
