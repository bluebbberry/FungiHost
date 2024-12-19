import { RuleParser } from "./rule-parser.service.js";
import masto from "../configs/mastodonclient.js";
import * as cron from "node-cron";
import { send, sendReply } from "./post.util.service.js";
import { getMentionsNotifications } from "./notifications.service.js";
import { decode } from 'html-entities';
import { FungiState } from "../model/FungiState.js";
import * as Config from "../configs/config.js";

/**
 * A fungi has the following five life cycle (based on https://github.com/bluebbberry/FediFungiHost/wiki/A-Fungi's-Lifecycle):
 *
 * 1. INITIAL SEARCH: Search under seed hashtag for FUNGI code (FUNGI is a custom DSL) - if success: procee, if not: sleep and try again.
 * 2. NEW CODE EXECUTION: The code is executed and feedback from user interactions is collected
 * 3. CALCULATE CODE HEALTH: After a while, the results are evaluated and a code health number is calculated
 * 4. SCRAPE & SHARE CODE HEALTH: The result with the related code is posted under the nutrition hashtag for other bots to process; at the same time, new code, potentially with evaulation results is scraped from the hashtag (of course, this may also come from human users).
 * 5. CALCULATE MUTATION: Based on one's own results, one's code history and the results from the other bots, a mutation from the current code is calculated and the life cycle start again from 3, this time with the picked code
 */
export class FungiService {
    static fungiService = new FungiService();

    constructor() {
        this.fungiState = new FungiState(null, 0);
        // Example input that is used in case nothing is found
        this.exampleCode = `
            FUNGISTART ONREPLY "Hello" DORESPOND "Hello, Fediverse user!"; FUNGIEND
        `;
        this.ruleParser = RuleParser.parser;
    }

    startFungiLifecycle() {
        this.runInitialSearch().then(() => {
            this.runFungiLifecycle().then(() => {
                const cronSchedule = '2 * * * *';
                cron.schedule(cronSchedule, () => {
                    this.runFungiLifecycle();
                });
                console.log("Scheduled fungi lifecycle " + this.cronToHumanReadable(cronSchedule));
            });
        });
    }

    startAnsweringMentions() {
        const answerSchedule = '*/3 * * * *';
        cron.schedule(answerSchedule, () => {
            this.checkForMentionsAndLetFungiAnswer();
        });
        console.log("Scheduled fungi answering " + this.cronToHumanReadable(answerSchedule));
    }

    async runInitialSearch() {
        // 1. initial search
        console.log("runInitialSearch");
        const status = await this.getStatusWithValidFUNGICodeFromFungiTag();
        if (status) {
            this.fungiState.setRuleSystem(decode(status.content));
        }
        else {
            this.fungiState.setRuleSystem(this.exampleCode);
        }
    }

    async runFungiLifecycle() {
        console.log("runFungiLifecycle");

        // 2. new code execution
        this.parseAndSetCommandsFromFungiCode(this.fungiState.getRuleSystem());

        // 3. calculate code health
        // TODO

        // 4. scrape and share code health
        this.postStatusUnderFungiTag(this.fungiState.getRuleSystem() + " Fitness: " + this.fungiState.getFitness());

        // 5. calculate mutation
        this.fungiState.setRuleSystem(this.getStatusWithValidFUNGICodeFromFungiTag(this.fungiState.getFitness()));
    }

    parseAndSetCommandsFromFungiCode(code) {
        const SUCCESS = true;
        const FAIL = false;
        console.log("Received fungi code: " + code);
        const staticRuleSystem = this.ruleParser.parse(code);
        this.fungiState.setRuleSystem(staticRuleSystem);
        console.log("Sucessfully parsed and set as commands");
        return SUCCESS;
    }

    async getStatusesFromFungiTag() {
        const statuses = await masto.v1.timelines.tag.$select(Config.MYCELIAL_HASHTAG).list({
            limit: 30,
        });
        return statuses;
    }

    postStatusUnderFungiTag(message) {
        send(message + "#" + Config.MYCELIAL_HASHTAG);
    }

    async getStatusWithValidFUNGICodeFromFungiTag() {
        const statuses = await this.getStatusesFromFungiTag();
        for (let i = 0; i < statuses.length; i++) {
            const status = statuses[i];
            const decodedStatusContent = decode(status.content);
            if (this.ruleParser.containsValidFUNGI(decodedStatusContent)) {
                console.log("found status with FUNGI code");
                return status;
            }
        }
    }

    async checkForMentionsAndLetFungiAnswer() {
        const mentions = await getMentionsNotifications();
        for (const mention of mentions) {
            const answer = await this.generateAnswerToText(mention.status.content);
            await sendReply(answer, mention.status);
        }
    }

    async generateAnswerToText(content) {
        console.log("generateAnswerToStatus with content", content);
        const fungiResult = this.ruleParser.calculateResponse(this.fungiState.getRuleSystem(), content);
        console.log("Response: '" + fungiResult + "'");
        return fungiResult;
    }
}
