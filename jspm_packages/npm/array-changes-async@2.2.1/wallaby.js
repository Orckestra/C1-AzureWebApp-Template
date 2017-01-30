
module.exports = function (wallaby) {

    return {
        files: [
            'lib/*.js'
        ],
        tests: ['test/*.spec.js'],
        env: {
            type: 'node',
            runner: 'node'
        }


    };
};
