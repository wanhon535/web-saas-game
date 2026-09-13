'use strict';

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const checks = [
  { file: 'p0-regression-check.js', name: 'P0 回归' },
  { file: 'p1-chapter-progression-check.js', name: 'P1 第一章推进' },
  { file: 'p1-equipment-check.js', name: 'P1 基础装备' },
  { file: 'p1-full-chapter-check.js', name: 'P1 第一章完整版' },
  { file: 'p1-chapter2-check.js', name: 'P1+ 第二章' },
  { file: 'p1-combat-survival-check.js', name: 'P1+ 护阵重构与复生规则' },
  { file: 'home-ui-check.js', name: '首页 UI 信息架构' },
];

let totalAssertions = 0;
const failures = [];

console.log(`开始执行 ${checks.length} 项自动化检查。`);

for (const check of checks) {
  console.log(`\n[执行] ${check.name}`);
  const result = spawnSync(process.execPath, [path.join(__dirname, check.file)], {
    encoding: 'utf8',
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.error || result.status !== 0) {
    failures.push(`${check.name}${result.error ? `：${result.error.message}` : `：退出码 ${result.status}`}`);
    continue;
  }

  const match = result.stdout && result.stdout.match(/：(\d+) 项断言全部通过。/);
  if (!match) {
    failures.push(`${check.name}：未识别到断言通过汇总。`);
    continue;
  }

  totalAssertions += Number(match[1]);
}

if (failures.length > 0) {
  console.error(`\n自动化检查失败：${failures.length} 项。`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`\n全部自动化检查通过：${checks.length} 项检查，${totalAssertions} 项断言通过。`);
}
