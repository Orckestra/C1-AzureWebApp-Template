
import Unexpected from 'unexpected';

import Weights from '../Weights';

const expect = Unexpected.clone();

describe('Weights', () => {

    let weights;

    beforeEach(() => {
        weights = new Weights();
    });

    it('initialises to 0', () => {

        expect(weights, 'to satisfy', {
            real: 0,
            total: 0
        });
    });

    describe('add', () => {
        it('adds a weight to both', () => {

            weights.add(10);
            expect(weights, 'to satisfy', {
                real: 10,
                total: 10
            });
        });
    });

    describe('addReal', () => {

        it('adds a weight to the real weight, not the all weight', () => {

            weights.addReal(10);
            expect(weights, 'to satisfy', {
                real: 10,
                total: 0
            });
        });
    });

    describe('addTotal', () => {

        it('adds a weight to the total weight, not the real weight', () => {

            weights.addTotal(10);
            expect(weights, 'to satisfy', {
                real: 0,
                total: 10
            });
        });
    });

    describe('addWeight', () => {

        it('adds a second weight to the initial weight', () => {
            weights.addReal(4);
            weights.addTotal(8);
            weights.addWeight(new Weights().addReal(16).addTotal(32));
            expect(weights, 'to satisfy', {
                real: 20,
                total: 40
            });
        });
    });
});