import hashlib
import json
from datetime import datetime
from web3 import Web3

CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

CONTRACT_ABI = [
    {
        "inputs": [
            {"internalType": "bytes32", "name": "merkleRoot", "type": "bytes32"},
            {"internalType": "string", "name": "orgId", "type": "string"},
            {"internalType": "string", "name": "framework", "type": "string"}
        ],
        "name": "anchorHash",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "bytes32", "name": "merkleRoot", "type": "bytes32"}],
        "name": "verifyHash",
        "outputs": [
            {"internalType": "bool", "name": "", "type": "bool"},
            {"internalType": "uint256", "name": "", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "string", "name": "orgId", "type": "string"}],
        "name": "getAuditTrail",
        "outputs": [
            {
                "components": [
                    {"internalType": "bytes32", "name": "merkleRoot", "type": "bytes32"},
                    {"internalType": "string", "name": "orgId", "type": "string"},
                    {"internalType": "string", "name": "framework", "type": "string"},
                    {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
                    {"internalType": "address", "name": "submittedBy", "type": "address"}
                ],
                "internalType": "struct AuditChain.AuditEntry[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]


def get_contract():
    w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))
    contract = w3.eth.contract(
        address=Web3.to_checksum_address(CONTRACT_ADDRESS),
        abi=CONTRACT_ABI
    )
    return w3, contract


def hash_event(event: dict) -> str:
    canonical = json.dumps(event, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode()).hexdigest()


def anchor_assessment(org_name: str, risk_score: float, risk_level: str, assessment_id: int):
    try:
        w3, contract = get_contract()

        event = {
            "org_name": org_name,
            "risk_score": round(risk_score, 1),
            "risk_level": risk_level,
            "assessment_id": assessment_id,
            "timestamp": datetime.utcnow().isoformat()
        }

        event_hash = hash_event(event)
        merkle_root = bytes.fromhex(event_hash)

        account = w3.eth.accounts[0]

        tx_hash = contract.functions.anchorHash(
            merkle_root,
            org_name,
            "NIST-CSF"
        ).transact({"from": account})

        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

        return {
            "success": True,
            "tx_hash": receipt.transactionHash.hex(),
            "block_number": receipt.blockNumber,
            "event_hash": event_hash,
            "org_name": org_name
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def verify_assessment(org_name: str, risk_score: float, risk_level: str, assessment_id: int):
    try:
        w3, contract = get_contract()

        event = {
            "org_name": org_name,
            "risk_score": round(risk_score, 1),
            "risk_level": risk_level,
            "assessment_id": assessment_id,
            "timestamp": None
        }

        event_hash = hash_event(event)
        merkle_root = bytes.fromhex(event_hash)

        verified, timestamp = contract.functions.verifyHash(merkle_root).call()

        return {
            "verified": verified,
            "timestamp": timestamp,
            "event_hash": event_hash
        }

    except Exception as e:
        return {
            "verified": False,
            "error": str(e)
        }


def get_audit_trail(org_name: str):
    try:
        w3, contract = get_contract()
        trail = contract.functions.getAuditTrail(org_name).call()

        result = []
        for entry in trail:
            result.append({
                "merkle_root": entry[0].hex(),
                "org_id": entry[1],
                "framework": entry[2],
                "timestamp": entry[3],
                "submitted_by": entry[4]
            })

        return {"success": True, "trail": result}

    except Exception as e:
        return {"success": False, "error": str(e)}