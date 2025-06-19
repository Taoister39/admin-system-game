import { beforeAll } from '@rstest/core';
import path from 'node:path';

beforeAll((suite) => {
  process.env.REBUILD_TEST_SUITE_CWD =
    'filepath' in suite ? path.dirname(suite.filepath) : '';
});
