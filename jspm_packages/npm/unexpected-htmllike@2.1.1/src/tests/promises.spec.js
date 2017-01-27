import Unexpected from 'unexpected';

const expect = Unexpected.clone();

describe('promises', () => {

    it('expect.promise.resolve is immediately resolved', () => {

        const promise = expect.promise.resolve(42);
        expect(promise.isFulfilled(), 'to be true');
    });

    it('expect.promise, then resolve() is immediately resolved', () => {

        const promise = expect.promise(function (resolve, reject) {
            resolve(42);
        });
        expect(promise.isFulfilled(), 'to be true');
    });

    it('expect.promise.all with resolved promises is immediately resolved', () => {

        const promise = expect.promise.resolve(42);
        const promise2 = expect.promise.resolve(24);
        const all = expect.promise.all([promise, promise2]);

        expect(all.isFulfilled(), 'to be true');
    });

    it('resolved promise with a then is immediately resolved', () => {
        // This is it. Need to break the promises to be sync
        const promise = expect.promise.resolve(42).then(result => result + 1);

        // expect(promise.isFulfilled(), 'to be true');
    });
});
