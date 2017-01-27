var Babel = require('babel');

module.exports = function (wallaby) {

    return {
        files: [
            '*.js',
            {
                pattern: 'test/*.spec.js',
                ignore: true
            }],

        tests: ['test/*.spec.js'],
        env: {
            type: 'node',
            runner: 'node'
        },

        compilers: {
            '**/*.js': wallaby.compilers.babel({
                babel: Babel
            })
        }

    };
};
