"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchEthCalls = void 0;
async function batchEthCalls(provider, calls) {
    const batchedCalls = calls.map((call) => provider.send("eth_call", [call, "latest"]));
    const results = await Promise.all(batchedCalls);
    return results;
}
exports.batchEthCalls = batchEthCalls;
//# sourceMappingURL=eth_calls.js.map