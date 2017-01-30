var Babel = require('babel');

module.exports = function (wallaby) {

    return {
        files: [
            'src/**/*.js',
            {
                pattern: 'src/**/tests/*.spec.js',
                ignore: true
            }],

        tests: ['src/**/*.spec.js'],
        env: {
            type: 'node',
            runner: 'node'
        },

        compilers: {
            '**/*.js': wallaby.compilers.babel({
                babel: Babel
            }),
            '**/*.jsx': wallaby.compilers.babel({
                babel: Babel
            })
        }
    };
};
