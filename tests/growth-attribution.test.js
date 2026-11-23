import test from "node:test";
import assert from "node:assert/strict";
import { CHANNELS, channelFromSearch, signupAttribution } from "../src/lib/growthAttribution.js";

test("UTM channels recognized, case insensitive, no arbitrary campaigns", () => {
  assert.equal(channelFromSearch("?utm_source=instagram&utm_campaign=campanha"), "instagram");
  assert.equal(channelFromSearch("?utm_source=FACEBOOK"), "facebook");
  assert.equal(channelFromSearch("?utm_source=IG"), "instagram");
  assert.equal(channelFromSearch("?utm_source=googleads"), "google");
  assert.equal(channelFromSearch("?utm_source=unknown"), "");
  assert.equal(channelFromSearch("?utm_source=https%3A%2F%2Fexample.com"), "");
  assert.equal(channelFromSearch(""), "");
});
test("signup attribution stores only chosen, allowlisted channel", () => {
  for (const channel of CHANNELS) assert.deepEqual(signupAttribution(channel), {growth_source_v1:channel});
  assert.deepEqual(signupAttribution(""), {});
  assert.deepEqual(signupAttribution("instagram&user=123"), {});
  assert.deepEqual(signupAttribution(null), {});
});
