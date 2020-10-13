define(['exports', './isObject', './_setup', './identity', './isFunction', './isArray', './keys', './extendOwn', './isMatch', './matcher', './property', './iteratee', './isNumber', './isNaN', './isArguments', './each', './invert', './after', './allKeys', './before', './restArguments', './bind', './bindAll', './chain', './chunk', './extend', './clone', './filter', './compact', './compose', './constant', './values', './sortedIndex', './findIndex', './indexOf', './contains', './countBy', './create', './delay', './debounce', './defaults', './partial', './defer', './difference', './escape', './every', './findKey', './find', './findLastIndex', './findWhere', './initial', './first', './flatten', './functions', './groupBy', './has', './isNull', './isUndefined', './isBoolean', './isElement', './isString', './isDate', './isRegExp', './isError', './isSymbol', './isMap', './isWeakMap', './isSet', './isWeakSet', './isArrayBuffer', './isDataView', './isFinite', './isTypedArray', './isEmpty', './isEqual', './pairs', './tap', './mapObject', './noop', './propertyOf', './times', './random', './now', './unescape', './templateSettings', './template', './result', './uniqueId', './memoize', './throttle', './wrap', './negate', './once', './lastIndexOf', './map', './reduce', './reduceRight', './reject', './some', './invoke', './pluck', './where', './max', './min', './sample', './shuffle', './sortBy', './indexBy', './partition', './toArray', './size', './pick', './omit', './rest', './last', './without', './uniq', './union', './intersection', './unzip', './zip', './object', './range', './mixin', './underscore-array-methods'], function (exports, isObject, _setup, identity, isFunction, isArray, keys, extendOwn, isMatch, matcher, property, iteratee, isNumber, _isNaN, isArguments, each, invert, after, allKeys, before, restArguments, bind, bindAll, chain, chunk, extend, clone, filter, compact, compose, constant, values, sortedIndex, findIndex, indexOf, contains, countBy, create, delay, debounce, defaults, partial, defer, difference, _escape, every, findKey, find, findLastIndex, findWhere, initial, first, flatten, functions, groupBy, has, isNull, isUndefined, isBoolean, isElement, isString, isDate, isRegExp, isError, isSymbol, isMap, isWeakMap, isSet, isWeakSet, isArrayBuffer, isDataView, _isFinite, isTypedArray, isEmpty, isEqual, pairs, tap, mapObject, noop, propertyOf, times, random, now, _unescape, templateSettings, template, result, uniqueId, memoize, throttle, wrap, negate, once, lastIndexOf, map, reduce, reduceRight, reject, some, invoke, pluck, where, max, min, sample, shuffle, sortBy, indexBy, partition, toArray, size, pick, omit, rest, last, without, uniq, union, intersection, unzip, zip, object, range, mixin, underscoreArrayMethods) {

         // Named Exports

         exports.isObject = isObject;
         exports.VERSION = _setup.VERSION;
         exports.identity = identity;
         exports.isFunction = isFunction;
         exports.isArray = isArray;
         exports.keys = keys;
         exports.assign = extendOwn;
         exports.extendOwn = extendOwn;
         exports.isMatch = isMatch;
         exports.matcher = matcher;
         exports.matches = matcher;
         exports.property = property;
         exports.iteratee = iteratee;
         exports.isNumber = isNumber;
         exports.isNaN = _isNaN;
         exports.isArguments = isArguments;
         exports.each = each;
         exports.forEach = each;
         exports.invert = invert;
         exports.after = after;
         exports.allKeys = allKeys;
         exports.before = before;
         exports.restArguments = restArguments;
         exports.bind = bind;
         exports.bindAll = bindAll;
         exports.chain = chain;
         exports.chunk = chunk;
         exports.extend = extend;
         exports.clone = clone;
         exports.filter = filter;
         exports.select = filter;
         exports.compact = compact;
         exports.compose = compose;
         exports.constant = constant;
         exports.values = values;
         exports.sortedIndex = sortedIndex;
         exports.findIndex = findIndex;
         exports.indexOf = indexOf;
         exports.contains = contains;
         exports.include = contains;
         exports.includes = contains;
         exports.countBy = countBy;
         exports.create = create;
         exports.delay = delay;
         exports.debounce = debounce;
         exports.defaults = defaults;
         exports.partial = partial;
         exports.defer = defer;
         exports.difference = difference;
         exports.escape = _escape;
         exports.all = every;
         exports.every = every;
         exports.findKey = findKey;
         exports.detect = find;
         exports.find = find;
         exports.findLastIndex = findLastIndex;
         exports.findWhere = findWhere;
         exports.initial = initial;
         exports.first = first;
         exports.head = first;
         exports.take = first;
         exports.flatten = flatten;
         exports.functions = functions;
         exports.methods = functions;
         exports.groupBy = groupBy;
         exports.has = has;
         exports.isNull = isNull;
         exports.isUndefined = isUndefined;
         exports.isBoolean = isBoolean;
         exports.isElement = isElement;
         exports.isString = isString;
         exports.isDate = isDate;
         exports.isRegExp = isRegExp;
         exports.isError = isError;
         exports.isSymbol = isSymbol;
         exports.isMap = isMap;
         exports.isWeakMap = isWeakMap;
         exports.isSet = isSet;
         exports.isWeakSet = isWeakSet;
         exports.isArrayBuffer = isArrayBuffer;
         exports.isDataView = isDataView;
         exports.isFinite = _isFinite;
         exports.isTypedArray = isTypedArray;
         exports.isEmpty = isEmpty;
         exports.isEqual = isEqual;
         exports.pairs = pairs;
         exports.tap = tap;
         exports.mapObject = mapObject;
         exports.noop = noop;
         exports.propertyOf = propertyOf;
         exports.times = times;
         exports.random = random;
         exports.now = now;
         exports.unescape = _unescape;
         exports.templateSettings = templateSettings;
         exports.template = template;
         exports.result = result;
         exports.uniqueId = uniqueId;
         exports.memoize = memoize;
         exports.throttle = throttle;
         exports.wrap = wrap;
         exports.negate = negate;
         exports.once = once;
         exports.lastIndexOf = lastIndexOf;
         exports.collect = map;
         exports.map = map;
         exports.foldl = reduce;
         exports.inject = reduce;
         exports.reduce = reduce;
         exports.foldr = reduceRight;
         exports.reduceRight = reduceRight;
         exports.reject = reject;
         exports.any = some;
         exports.some = some;
         exports.invoke = invoke;
         exports.pluck = pluck;
         exports.where = where;
         exports.max = max;
         exports.min = min;
         exports.sample = sample;
         exports.shuffle = shuffle;
         exports.sortBy = sortBy;
         exports.indexBy = indexBy;
         exports.partition = partition;
         exports.toArray = toArray;
         exports.size = size;
         exports.pick = pick;
         exports.omit = omit;
         exports.drop = rest;
         exports.rest = rest;
         exports.tail = rest;
         exports.last = last;
         exports.without = without;
         exports.uniq = uniq;
         exports.unique = uniq;
         exports.union = union;
         exports.intersection = intersection;
         exports.transpose = unzip;
         exports.unzip = unzip;
         exports.zip = zip;
         exports.object = object;
         exports.range = range;
         exports.mixin = mixin;
         exports.default = underscoreArrayMethods;

         Object.defineProperty(exports, '__esModule', { value: true });

});
