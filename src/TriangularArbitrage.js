"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriangularArbitrage = void 0;
var ethers_1 = require("ethers");
var Arbitrage_1 = require("./Arbitrage");
var TriangularArbitrage = /** @class */ (function () {
    function TriangularArbitrage() {
    }
    TriangularArbitrage.evaluateMarkets = function (marketsByToken) {
        return __awaiter(this, void 0, void 0, function () {
            var potentialOpportunities, _loop_1, _i, _a, _b, tokenA, marketsA;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        potentialOpportunities = [];
                        _loop_1 = function (tokenA, marketsA) {
                            var _loop_2, _d, _e, _f, tokenB, marketsB;
                            return __generator(this, function (_g) {
                                switch (_g.label) {
                                    case 0:
                                        _loop_2 = function (tokenB, marketsB) {
                                            var marketAB, marketBA, _loop_3, _h, _j, _k, tokenC, marketsC;
                                            return __generator(this, function (_l) {
                                                switch (_l.label) {
                                                    case 0:
                                                        if (tokenA === tokenB)
                                                            return [2 /*return*/, "continue"];
                                                        marketAB = marketsA.find(function (market) { return market.tokenAddress === tokenB; });
                                                        marketBA = marketsB.find(function (market) { return market.tokenAddress === tokenA; });
                                                        if (!marketAB || !marketBA)
                                                            return [2 /*return*/, "continue"];
                                                        _loop_3 = function (tokenC, marketsC) {
                                                            var marketAC, marketCA, profit, volume;
                                                            return __generator(this, function (_m) {
                                                                switch (_m.label) {
                                                                    case 0:
                                                                        if (tokenA === tokenC || tokenB === tokenC)
                                                                            return [2 /*return*/, "continue"];
                                                                        marketAC = marketsA.find(function (market) { return market.tokenAddress === tokenC; });
                                                                        marketCA = marketsC.find(function (market) { return market.tokenAddress === tokenA; });
                                                                        if (!marketAC || !marketCA)
                                                                            return [2 /*return*/, "continue"];
                                                                        profit = calculateTriangularArbitrageProfit(marketAB, marketBA, marketAC, marketCA);
                                                                        if (!profit.gt(ethers_1.BigNumber.from("10000000000000000"))) return [3 /*break*/, 2];
                                                                        return [4 /*yield*/, (0, Arbitrage_1.calculateOptimalVolume)(marketAB, marketBA, tokenA, profit.toNumber())];
                                                                    case 1:
                                                                        volume = _m.sent();
                                                                        potentialOpportunities.push({
                                                                            profit: profit,
                                                                            volume: volume,
                                                                            tokenAddress: tokenA,
                                                                            marketPairs: [marketAB, marketBA],
                                                                            buyFromMarket: marketAB,
                                                                            sellToMarket: marketBA
                                                                        });
                                                                        _m.label = 2;
                                                                    case 2: return [2 /*return*/];
                                                                }
                                                            });
                                                        };
                                                        _h = 0, _j = Object.entries(marketsByToken);
                                                        _l.label = 1;
                                                    case 1:
                                                        if (!(_h < _j.length)) return [3 /*break*/, 4];
                                                        _k = _j[_h], tokenC = _k[0], marketsC = _k[1];
                                                        return [5 /*yield**/, _loop_3(tokenC, marketsC)];
                                                    case 2:
                                                        _l.sent();
                                                        _l.label = 3;
                                                    case 3:
                                                        _h++;
                                                        return [3 /*break*/, 1];
                                                    case 4: return [2 /*return*/];
                                                }
                                            });
                                        };
                                        _d = 0, _e = Object.entries(marketsByToken);
                                        _g.label = 1;
                                    case 1:
                                        if (!(_d < _e.length)) return [3 /*break*/, 4];
                                        _f = _e[_d], tokenB = _f[0], marketsB = _f[1];
                                        return [5 /*yield**/, _loop_2(tokenB, marketsB)];
                                    case 2:
                                        _g.sent();
                                        _g.label = 3;
                                    case 3:
                                        _d++;
                                        return [3 /*break*/, 1];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        };
                        _i = 0, _a = Object.entries(marketsByToken);
                        _c.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        _b = _a[_i], tokenA = _b[0], marketsA = _b[1];
                        return [5 /*yield**/, _loop_1(tokenA, marketsA)];
                    case 2:
                        _c.sent();
                        _c.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, potentialOpportunities];
                }
            });
        });
    };
    return TriangularArbitrage;
}());
exports.TriangularArbitrage = TriangularArbitrage;
function calculateTriangularArbitrageProfit(marketAB, marketBA, marketAC, marketCA) {
    // Calculate the conversion rate from A to B
    var rateAB = marketAB.reserve1.div(marketAB.reserve0);
    // Calculate the conversion rate from B to C
    var rateBC = marketBA.reserve0.div(marketBA.reserve1);
    // Calculate the conversion rate from C to A
    var rateCA = marketCA.reserve1.div(marketCA.reserve0);
    // Calculate the round-trip rate of return
    var rateReturn = rateAB.mul(rateBC).mul(rateCA);
    // If the round-trip rate of return is greater than 1, there's a profit to be made
    var profit = rateReturn.gt(ethers_1.BigNumber.from(1)) ? rateReturn.sub(1) : ethers_1.BigNumber.from(0);
    return profit;
}
