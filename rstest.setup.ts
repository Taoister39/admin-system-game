import path from 'node:path';
import { beforeAll } from '@rstest/core';

beforeAll((suite) => {
  process.env.REBUILD_TEST_SUITE_CWD =
    'filepath' in suite ? path.dirname(suite.filepath) : '';
});
