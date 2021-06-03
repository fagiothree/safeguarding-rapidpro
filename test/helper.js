import * as assert from 'assert';
import { scream } from '../helper.js';

describe('scream', () => {
    it('should return 123 for no reason at all', () => {
        assert.equal(scream(), 123);
    });
});
