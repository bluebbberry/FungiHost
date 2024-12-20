import { assert } from 'chai';
import {EvolutionaryAlgorithm} from "../../src/services/evolutionary-algorithm.service.js";
import {StaticRuleSystem} from "../../src/model/StaticRuleSystem.js";
import {StaticRule} from "../../src/model/StaticRule.js";
import {FungiHistory} from "../../src/model/FungiHistory.js";
import {MycelialFungiHistory} from "../../src/model/MycelialFungiHistory.js";
import {FungiState} from "../../src/model/FungiState.js";

describe('EvolutionaryAlgorithm', () => {
    let algorithm, fungiHistory, currentSystem;

    beforeEach(() => {
        algorithm = EvolutionaryAlgorithm.evolutionaryAlgorithm;
        fungiHistory = new FungiHistory([
            new FungiState(new StaticRuleSystem([new StaticRule("hello", "Hi there!")]), 0.9),
            new FungiState(new StaticRuleSystem([new StaticRule("pricing", "Check our pricing.")]), 0.8)
        ]);
        currentSystem = new StaticRuleSystem([new StaticRule("support", "Support is available.")]);
    });

    it('should create a weighted pool from history', () => {
        const pool = algorithm.createPool(fungiHistory, new MycelialFungiHistory([]), currentSystem);
        assert.include(pool.getRuleSystems(), currentSystem);
        assert.isAbove(pool.getRuleSystems().length, fungiHistory.getFungiStates().length);
    });

    it('should mutate a rule system correctly', () => {
        const mutatedSystem = algorithm.mutate(currentSystem);
        assert.instanceOf(mutatedSystem, StaticRuleSystem);
        assert.isNotEmpty(mutatedSystem.getRules());
    });

    it('should mutate individual rules', () => {
        const rule = new StaticRule("hello", "Hi there!");
        const mutatedRule = algorithm.mutateRule(rule);
        assert.instanceOf(mutatedRule, StaticRule);
        assert.notEqual(mutatedRule.trigger, rule.trigger);
    });

    it('should generate random rules', () => {
        const randomRule = algorithm.generateRandomRule();
        assert.instanceOf(randomRule, StaticRule);
        assert.isString(randomRule.trigger);
        assert.isString(randomRule.response);
    });

    it('should perform crossover between two rule systems', () => {
        const parent1 = new StaticRuleSystem([new StaticRule("hello", "Hi there!")]);
        const parent2 = new StaticRuleSystem([new StaticRule("pricing", "Check our pricing.")]);

        const offspring = algorithm.crossover(parent1, parent2);
        assert.instanceOf(offspring, StaticRuleSystem);
        assert.isNotEmpty(offspring.getRules());
    });

    it('should evolve a new rule system', () => {
        const newSystem = algorithm.evolve(fungiHistory, new MycelialFungiHistory([]), currentSystem);
        assert.instanceOf(newSystem, StaticRuleSystem);
        assert.isNotEmpty(newSystem.getRules());
    });
});
