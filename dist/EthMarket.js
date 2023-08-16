<<<<<<< HEAD
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EthMarket = void 0;
class EthMarket {
    get tokens() {
        return this._tokens;
    }
    get marketAddress() {
        return this._marketAddress;
    }
    get protocol() {
        return this._protocol;
    }
    constructor(marketAddress, tokens, protocol) {
        this._marketAddress = marketAddress;
        this._tokens = tokens;
        this._protocol = protocol;
    }
}
exports.EthMarket = EthMarket;
=======
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EthMarket = void 0;
class EthMarket {
    constructor(marketAddress, tokens, protocol) {
        this._marketAddress = marketAddress;
        this._tokens = tokens;
        this._protocol = protocol;
    }
    get tokens() {
        return this._tokens;
    }
    get marketAddress() {
        return this._marketAddress;
    }
    get protocol() {
        return this._protocol;
    }
}
exports.EthMarket = EthMarket;
>>>>>>> 4aa599175b4e823f381cb0498c1a10c7c5442af5
//# sourceMappingURL=EthMarket.js.map