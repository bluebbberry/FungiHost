import { assert } from 'chai';
import {FungiParser} from "../../src/services/fungi-parser.service.js";

const fungiParser = new FungiParser();
const testCode1 = `
FUNGISTART ONREPLY "Hello" DORESPOND "Hello, Fediverse user!"; FUNGIEND
`;

describe('Test parser', function(){
    it('process code 1 correctly', function(){
        const tokens = fungiParser.tokenize(testCode1);
        const commands = fungiParser.parse(tokens);
        const reply = fungiParser.execute(commands, "Hello, Fediverse user!");

        assert.equal(reply, "Hello, Fediverse user!");
    });
});