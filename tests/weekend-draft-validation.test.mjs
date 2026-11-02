import test from 'node:test';
import assert from 'node:assert/strict';
import {validateWeekendDraft} from '../weekend-draft-validation.js';
const draft={names:['You','Buddy'],holes:[[4,5]],games:[{id:'hole',format:'hole',stakeCents:500}]};
test('valid saved scores and stake survive unchanged',()=>assert.deepEqual(validateWeekendDraft(draft),draft));
test('corrupt stored scores are rejected',()=>assert.throws(()=>validateWeekendDraft({...draft,holes:[[4,0]]}),/scores/));
test('unintended wager changes are not silently accepted',()=>assert.throws(()=>validateWeekendDraft({...draft,games:[{id:'hole',format:'hole',stakeCents:-100}]}),/stake/));
