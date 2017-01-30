
let unique = 1000;

function Weights() {
    this.unique = ++unique;
    this.real = 0;
    this.total = 0;
}

Weights.prototype.add = function (weight) {
    if (typeof weight !== 'number') {
        throw new Error('add takes a numeric parameter');
    }
//    console.log('Adding ', weight, 'to', this.name, 'results in ', this.total, this.real);
    this.real += weight;
    this.total += weight;
    return this;
};

Weights.prototype.addReal = function (weight) {
    if (typeof weight !== 'number') {
        throw new Error('addReal takes a numeric parameter');
    }
    this.real += weight;
    //console.log('Adding real', weight, 'to', this.name, 'results in', this.real);
    return this;
};

Weights.prototype.addTotal = function (weight) {
    if (typeof weight !== 'number') {
        throw new Error('addTotal takes a numeric parameter');
    }
    this.total += weight;
    //console.log('Adding total', weight, 'to', this.name, 'results in', this.total);
    return this;
};

Weights.prototype.addWeight = function (weight) {
    if (!weight instanceof Weights) {
        throw new Error('addWeight can only add other Weight objects');
    }
    this.real += weight.real;
    this.total += weight.total;
    //console.log('Adding total', weight.total, 'and real', weight.real, 'to', this.name, 'results in (total/real)', this.total, this.real);

    if (isNaN(this.real)) {
        throw new Error('caused nan');
    }
    return this;
};

Weights.prototype.setName = function (name) {
    this.name = '(' + this.unique + ') ' + name;
    return this;
};

module.exports = Weights;