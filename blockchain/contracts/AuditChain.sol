// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AuditChain {

    struct AuditEntry {
        bytes32 merkleRoot;
        string orgId;
        string framework;
        uint256 timestamp;
        address submittedBy;
    }

    mapping(uint256 => AuditEntry) public entries;
    mapping(string => uint256[]) public orgEntries;
    uint256 public entryCount;

    event HashAnchored(
        uint256 indexed entryId,
        bytes32 merkleRoot,
        string orgId,
        string framework,
        uint256 timestamp
    );

    function anchorHash(
        bytes32 merkleRoot,
        string memory orgId,
        string memory framework
    ) public returns (uint256) {
        uint256 entryId = entryCount;

        entries[entryId] = AuditEntry({
            merkleRoot: merkleRoot,
            orgId: orgId,
            framework: framework,
            timestamp: block.timestamp,
            submittedBy: msg.sender
        });

        orgEntries[orgId].push(entryId);
        entryCount++;

        emit HashAnchored(entryId, merkleRoot, orgId, framework, block.timestamp);

        return entryId;
    }

    function verifyHash(bytes32 merkleRoot) public view returns (bool, uint256) {
        for (uint256 i = 0; i < entryCount; i++) {
            if (entries[i].merkleRoot == merkleRoot) {
                return (true, entries[i].timestamp);
            }
        }
        return (false, 0);
    }

    function getAuditTrail(string memory orgId) public view returns (AuditEntry[] memory) {
        uint256[] memory ids = orgEntries[orgId];
        AuditEntry[] memory trail = new AuditEntry[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            trail[i] = entries[ids[i]];
        }

        return trail;
    }

    function getEntry(uint256 entryId) public view returns (AuditEntry memory) {
        return entries[entryId];
    }
}