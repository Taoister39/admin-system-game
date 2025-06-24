import { sayHi } from '../src/renderer/utils/say_hi';

test('should sayHi correctly', () => {
  expect(sayHi()).toBe('hi');
});
