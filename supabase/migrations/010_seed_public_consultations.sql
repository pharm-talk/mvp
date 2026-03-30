-- 공개 상담 예시 데이터 (시드)
-- auth.users에서 실제 유저 ID를 가져와서 사용

create or replace function seed_public_consultations()
returns void as $$
declare
  real_user_id uuid;
begin

-- 실제 존재하는 유저 ID 가져오기 (아무나 한 명)
select id into real_user_id from auth.users limit 1;

-- 유저가 없으면 종료
if real_user_id is null then
  raise notice 'No users found in auth.users. Skipping seed.';
  return;
end if;

-- 1. 고혈압약 + 자몽 상호작용
insert into public.consultations (id, user_id, content, status, ai_report, ai_report_at, answer, answered_at, verified_by, verified_at, created_at, updated_at)
values (
  gen_random_uuid(), real_user_id,
  '고혈압약 암로디핀을 복용 중인데, 자몽주스를 매일 마셔도 되나요? 아침에 약 먹고 점심에 자몽주스를 마시고 있어요.',
  'answered',
  '[요약]
암로디핀과 자몽주스는 상호작용이 있어 주의가 필요합니다. 자몽에 포함된 푸라노쿠마린 성분이 약물 대사를 방해하여 혈중 농도가 과도하게 높아질 수 있습니다.

[상호작용 분석]
- 자몽주스의 푸라노쿠마린이 간의 CYP3A4 효소를 억제
- 암로디핀의 혈중 농도가 정상보다 1.5~2배 상승 가능
- 과도한 혈압 강하, 어지러움, 두통 등의 부작용 위험 증가

[주의사항]
- 자몽주스 대신 오렌지주스나 사과주스로 대체하는 것을 권장
- 약 복용 시간과 관계없이 자몽 자체를 피하는 것이 안전
- 자몽의 효소 억제 효과는 24시간 이상 지속될 수 있음

[권장사항]
- 담당 의사에게 자몽 섭취에 대해 상담
- 대체 과일(오렌지, 사과, 배 등)으로 비타민 C 보충
- 혈압 수치를 정기적으로 모니터링',
  now() - interval '6 days',
  '암로디핀과 자몽주스는 함께 드시면 안 됩니다. AI 분석 내용이 정확하며, 자몽뿐 아니라 자몽이 들어간 음료나 마멀레이드도 피해주세요. 오렌지주스는 안전하게 드실 수 있습니다.',
  now() - interval '5 days 20 hours',
  real_user_id,
  now() - interval '5 days 18 hours',
  now() - interval '6 days',
  now() - interval '5 days 18 hours'
);

-- 2. 비타민D + 칼슘 복용법
insert into public.consultations (id, user_id, content, status, ai_report, ai_report_at, answer, answered_at, verified_by, verified_at, created_at, updated_at)
values (
  gen_random_uuid(), real_user_id,
  '비타민D 4000IU랑 칼슘 600mg을 같이 먹어도 되나요? 골다공증 예방으로 먹으려고 하는데 같이 먹는 게 좋은지, 따로 먹는 게 좋은지 궁금합니다.',
  'answered',
  '[요약]
비타민D와 칼슘은 함께 복용해도 안전하며, 오히려 시너지 효과가 있습니다. 다만 복용 시간과 용량에 주의가 필요합니다.

[상호작용 분석]
- 비타민D는 장에서 칼슘 흡수를 촉진하는 역할
- 함께 복용 시 칼슘 흡수율이 30~40% 향상
- 골다공증 예방에 두 영양소의 병용이 권장됨

[복용 가이드]
- 비타민D는 지용성이므로 식후에 복용하면 흡수율 향상
- 칼슘은 한 번에 500mg 이하로 나눠 먹는 것이 효과적
- 600mg은 한 번에 복용해도 무리 없는 용량
- 철분제와는 2시간 이상 간격을 두고 복용

[권장사항]
- 점심 또는 저녁 식후에 함께 복용
- 비타민D 4000IU는 안전한 용량 범위 내
- 3~6개월 후 혈중 비타민D 수치 검사 권장',
  now() - interval '5 days',
  null,
  null,
  real_user_id,
  now() - interval '4 days 16 hours',
  now() - interval '5 days',
  now() - interval '4 days 16 hours'
);

-- 3. 타이레놀 + 술
insert into public.consultations (id, user_id, content, status, ai_report, ai_report_at, answer, answered_at, verified_by, verified_at, created_at, updated_at)
values (
  gen_random_uuid(), real_user_id,
  '어제 술을 좀 많이 마셨는데 두통이 심해서 타이레놀 먹어도 될까요? 아세트아미노펜 500mg짜리요. 아직 숙취가 남아있는 것 같아요.',
  'answered',
  '[요약]
음주 후 아세트아미노펜(타이레놀) 복용은 간 손상 위험이 있어 주의가 필요합니다. 가능하면 이부프로펜 등 다른 진통제를 고려하시는 것이 좋습니다.

[주의사항]
- 알코올과 아세트아미노펜 모두 간에서 대사됨
- 음주 후 간이 알코올 분해에 집중하는 상태에서 아세트아미노펜 복용 시 간독성 위험 증가
- 특히 만성 음주자의 경우 간 손상 위험이 더 높음
- 1일 3잔 이상 음주하는 경우 아세트아미노펜 사용 자체를 피해야 함

[대안]
- 이부프로펜(애드빌) 200~400mg 복용 가능 (단, 위장 보호를 위해 음식과 함께)
- 충분한 수분 섭취와 휴식이 숙취 해소에 가장 효과적
- 숙취 해소 음료보다 물, 이온음료가 효과적

[권장사항]
- 음주 후 최소 24시간은 아세트아미노펜 복용을 피하는 것이 안전
- 두통이 심하면 이부프로펜을 식후에 복용
- 48시간 이상 두통이 지속되면 병원 방문 권장',
  now() - interval '4 days',
  '음주 후 타이레놀 복용은 삼가세요. AI 분석 내용이 정확합니다. 추가로 말씀드리면, 이부프로펜도 위장이 예민하신 분은 주의가 필요합니다. 가장 좋은 방법은 충분한 수분 섭취와 휴식이에요.',
  now() - interval '3 days 20 hours',
  real_user_id,
  now() - interval '3 days 18 hours',
  now() - interval '4 days',
  now() - interval '3 days 18 hours'
);

-- 4. 임산부 엽산 + 철분
insert into public.consultations (id, user_id, content, status, ai_report, ai_report_at, answer, answered_at, verified_by, verified_at, created_at, updated_at)
values (
  gen_random_uuid(), real_user_id,
  '임신 12주차인데 산부인과에서 엽산이랑 철분제를 처방받았어요. 두 개를 같이 먹어도 되나요? 오전에 같이 먹으면 속이 좀 불편해서요.',
  'answered',
  '[요약]
엽산과 철분제는 임신 중 필수 영양소이며, 함께 복용해도 안전합니다. 다만 위장 불편감을 줄이기 위한 복용법 조절이 필요합니다.

[복용 가이드]
- 엽산: 공복 또는 식후 관계없이 복용 가능
- 철분제: 공복 복용 시 흡수율이 높지만, 위장 불편감이 심할 경우 식후 복용 가능
- 비타민C와 함께 복용하면 철분 흡수율 향상

[주의사항]
- 철분제와 칼슘, 유제품, 카페인은 2시간 이상 간격 유지
- 철분제 복용 후 변 색이 검게 변하는 것은 정상
- 변비가 심해지면 담당 의사에게 상담

[권장사항]
- 아침 식후: 엽산 복용
- 점심 식전 또는 식후 2시간: 철분제 복용 (오렌지주스와 함께)
- 시간을 분리하면 위장 불편감 크게 감소
- 구역감이 심하면 취침 전 철분제 복용도 가능',
  now() - interval '3 days',
  null,
  null,
  real_user_id,
  now() - interval '2 days 12 hours',
  now() - interval '3 days',
  now() - interval '2 days 12 hours'
);

-- 5. 오메가3 + 혈압약
insert into public.consultations (id, user_id, content, status, ai_report, ai_report_at, answer, answered_at, verified_by, verified_at, created_at, updated_at)
values (
  gen_random_uuid(), real_user_id,
  '오메가3를 건강을 위해 먹으려고 하는데, 현재 혈압약(로사르탄)을 복용 중이에요. 같이 먹어도 괜찮을까요? 오메가3 용량은 1000mg입니다.',
  'answered',
  '[요약]
오메가3와 로사르탄(혈압약)은 함께 복용해도 안전합니다. 오메가3는 혈압 강하에 보조적인 도움을 줄 수 있어 긍정적인 조합입니다.

[상호작용 분석]
- 오메가3의 EPA/DHA 성분이 혈관 건강에 도움
- 혈압 강하 효과가 약간 있어 로사르탄과 시너지 가능
- 고용량(3000mg 이상)에서만 출혈 위험이 약간 증가

[복용 가이드]
- 오메가3 1000mg은 안전한 용량
- 지방이 포함된 식사 후 복용 시 흡수율 향상
- 혈압약과 같은 시간에 복용해도 무방

[주의사항]
- 수술 예정이라면 1~2주 전 오메가3 중단 필요 (출혈 위험)
- 비린내가 거슬리면 냉장 보관 또는 취침 전 복용
- rTG 형태의 오메가3가 흡수율이 더 높음',
  now() - interval '2 days',
  '오메가3 1000mg과 로사르탄은 안전하게 함께 드실 수 있습니다. AI 분석 내용에 동의하며, 오메가3 제품 선택 시 EPA+DHA 함량이 총 600mg 이상인 제품을 추천드립니다.',
  now() - interval '1 day 20 hours',
  real_user_id,
  now() - interval '1 day 18 hours',
  now() - interval '2 days',
  now() - interval '1 day 18 hours'
);

-- 6. 항생제 + 유산균
insert into public.consultations (id, user_id, content, status, ai_report, ai_report_at, answer, answered_at, verified_by, verified_at, created_at, updated_at)
values (
  gen_random_uuid(), real_user_id,
  '감기로 항생제(아목시실린)를 처방받았는데 평소 먹던 유산균을 계속 먹어도 될까요? 항생제가 유산균을 죽인다고 들어서요.',
  'answered',
  '[요약]
항생제와 유산균은 시간 간격을 두고 복용하면 됩니다. 오히려 항생제 복용 기간에 유산균을 함께 먹으면 장 건강 유지에 도움이 됩니다.

[상호작용 분석]
- 항생제는 유해균뿐 아니라 유익균도 함께 제거
- 동시 복용 시 유산균의 효과가 감소할 수 있음
- 시간 간격을 두면 유산균이 장에 정착할 시간 확보

[복용 가이드]
- 항생제와 유산균은 최소 2시간 이상 간격 유지
- 예: 항생제 아침 식후 → 유산균 점심 식전 또는 취침 전
- 항생제 복용 완료 후에도 1~2주간 유산균 지속 복용 권장

[권장사항]
- 항생제 복용 중 설사가 심해지면 유산균 용량을 늘리는 것도 방법
- 사카로미세스 보울라디(Saccharomyces boulardii) 균주는 항생제에 강해 추천
- 항생제 복용 기간 중 발효 식품(김치, 요거트)도 장 건강에 도움',
  now() - interval '1 day 12 hours',
  null,
  null,
  real_user_id,
  now() - interval '1 day 6 hours',
  now() - interval '1 day 12 hours',
  now() - interval '1 day 6 hours'
);

-- 7. 수면제 + 멜라토닌
insert into public.consultations (id, user_id, content, status, ai_report, ai_report_at, answer, answered_at, verified_by, verified_at, created_at, updated_at)
values (
  gen_random_uuid(), real_user_id,
  '불면증으로 졸피뎀을 처방받아 먹고 있는데, 멜라토닌 보충제를 추가로 먹어도 될까요? 더 잘 잘 수 있을 것 같아서요.',
  'answered',
  '[요약]
졸피뎀과 멜라토닌의 병용은 권장되지 않습니다. 두 약물 모두 진정 효과가 있어 과도한 졸음, 어지러움 등의 부작용이 증가할 수 있습니다.

[주의사항]
- 졸피뎀은 강력한 수면 유도제로 중추신경계에 작용
- 멜라토닌도 수면 유도 호르몬으로 진정 효과 있음
- 병용 시 과도한 졸음, 다음 날 멍한 느낌, 균형감각 저하 위험
- 특히 고령자에서 낙상 위험 증가

[대안]
- 수면 위생 개선: 일정한 취침/기상 시간, 취침 전 스마트폰 사용 자제
- 카페인은 오후 2시 이후 섭취 자제
- 취침 전 따뜻한 목욕, 가벼운 스트레칭
- 졸피뎀에서 멜라토닌으로 전환하고 싶다면 반드시 의사와 상담

[권장사항]
- 현재 졸피뎀을 복용 중이라면 멜라토닌 추가 복용은 피하세요
- 졸피뎀 감량이나 중단은 반드시 처방의와 상의
- 수면 일기를 작성하여 수면 패턴을 파악하는 것도 도움',
  now() - interval '1 day',
  '졸피뎀과 멜라토닌의 병용은 피하셔야 합니다. AI 분석이 정확합니다. 졸피뎀은 의존성이 있는 약이므로 장기 복용보다는 수면 위생 개선과 함께 점진적으로 줄여가는 것이 좋습니다. 담당 의사와 상의해주세요.',
  now() - interval '20 hours',
  real_user_id,
  now() - interval '18 hours',
  now() - interval '1 day',
  now() - interval '18 hours'
);

-- 8. 아이 해열제 교차 복용
insert into public.consultations (id, user_id, content, status, ai_report, ai_report_at, answer, answered_at, verified_by, verified_at, created_at, updated_at)
values (
  gen_random_uuid(), real_user_id,
  '3살 아이가 열이 39도인데 타이레놀 먹인 지 3시간밖에 안 됐어요. 아직 열이 안 내려가는데 부루펜을 교차 투여해도 될까요?',
  'answered',
  '[요약]
소아에서 아세트아미노펜(타이레놀)과 이부프로펜(부루펜)의 교차 투여는 가능하지만, 올바른 간격과 용량을 지키는 것이 중요합니다.

[교차 투여 가이드]
- 타이레놀 투여 후 4시간 경과 시 부루펜 투여 가능
- 3시간만 경과한 상태라면 1시간 더 기다린 후 투여
- 부루펜 투여 후에는 6시간 이상 경과 후 다시 타이레놀 투여

[주의사항]
- 체중에 맞는 정확한 용량 확인 필수
- 타이레놀: 체중 1kg당 10~15mg, 4~6시간 간격
- 부루펜: 체중 1kg당 5~10mg, 6~8시간 간격
- 6개월 미만 영아에게는 부루펜 사용 불가

[응급 상황 체크]
- 열이 40도 이상이면서 경련 증상이 있으면 즉시 응급실
- 3일 이상 열이 지속되면 소아과 방문
- 수분 섭취를 충분히 시키고, 미지근한 물로 닦아주기',
  now() - interval '16 hours',
  '교차 투여는 가능하지만 4시간 간격을 꼭 지켜주세요. 3시간밖에 안 됐으면 1시간만 더 기다려주세요. 그 사이에 미지근한 물수건으로 목, 겨드랑이, 사타구니를 닦아주시면 해열에 도움됩니다.',
  now() - interval '14 hours',
  real_user_id,
  now() - interval '13 hours',
  now() - interval '16 hours',
  now() - interval '13 hours'
);

-- 9. 당뇨약 + 홍삼
insert into public.consultations (id, user_id, content, status, ai_report, ai_report_at, answer, answered_at, verified_by, verified_at, created_at, updated_at)
values (
  gen_random_uuid(), real_user_id,
  '당뇨약 메트포르민 500mg 복용 중인데 건강을 위해 홍삼을 먹으려고 해요. 당뇨약이랑 홍삼이랑 같이 먹어도 괜찮나요?',
  'answered',
  '[요약]
메트포르민과 홍삼은 병용 시 저혈당 위험이 있으므로 주의가 필요합니다. 홍삼이 혈당 강하 효과가 있어 메트포르민과 함께 복용하면 혈당이 과도하게 떨어질 수 있습니다.

[상호작용 분석]
- 홍삼의 진세노사이드 성분이 인슐린 분비를 촉진
- 메트포르민의 혈당 강하 효과와 중복되어 저혈당 위험
- 특히 식사를 거르거나 운동 후에 위험 증가

[주의사항]
- 저혈당 증상: 식은땀, 손 떨림, 어지러움, 심한 공복감
- 저혈당 발생 시 사탕이나 주스를 빠르게 섭취
- 홍삼 외 인삼, 크롬, 알파리포산도 혈당에 영향 가능

[권장사항]
- 홍삼 복용을 원한다면 반드시 담당 의사에게 상담
- 소량부터 시작하여 혈당 변화를 모니터링
- 혈당 체크 빈도를 늘려 변화 관찰
- 공복에 홍삼 복용은 피하고, 식후에 복용',
  now() - interval '12 hours',
  '메트포르민과 홍삼의 병용은 신중해야 합니다. AI 분석이 정확하며, 특히 당뇨 관리가 잘 되고 있는 분이라면 홍삼이 혈당 균형을 깨뜨릴 수 있어요. 꼭 담당 의사와 상의하시고, 드시더라도 소량부터 시작하세요.',
  now() - interval '10 hours',
  real_user_id,
  now() - interval '9 hours',
  now() - interval '12 hours',
  now() - interval '9 hours'
);

-- 10. 피부과 약 + 비타민A
insert into public.consultations (id, user_id, content, status, ai_report, ai_report_at, answer, answered_at, verified_by, verified_at, created_at, updated_at)
values (
  gen_random_uuid(), real_user_id,
  '여드름으로 피부과에서 이소트레티노인(로아큐탄)을 처방받았어요. 멀티비타민에 비타민A가 들어있는데 같이 먹어도 되나요?',
  'answered',
  '[요약]
이소트레티노인(로아큐탄)과 비타민A 함유 멀티비타민의 병용은 금기입니다. 이소트레티노인 자체가 비타민A 유도체이므로, 추가 비타민A 섭취는 비타민A 과잉증을 유발할 수 있습니다.

[금기 사항]
- 이소트레티노인 = 비타민A(레티노이드) 유도체
- 비타민A 추가 섭취 시 독성 위험: 두통, 어지러움, 간 손상, 피부 건조 악화
- 멀티비타민 외에도 대구 간유, 비타민A 보충제 모두 금기

[주의사항]
- 이소트레티노인 복용 중에는 비타민A가 없는 멀티비타민 선택
- 복용 중 임신 절대 금기 (태아 기형 위험)
- 헌혈도 복용 중 및 중단 후 1개월간 불가

[권장사항]
- 비타민A가 제외된 멀티비타민 제품으로 교체 (예: 이소트레티노인 전용 영양제)
- 피부 건조 관리를 위해 보습제 충분히 사용
- 이소트레티노인 복용 중 음주도 자제 (간 부담)',
  now() - interval '8 hours',
  null,
  null,
  real_user_id,
  now() - interval '6 hours',
  now() - interval '8 hours',
  now() - interval '6 hours'
);

-- 11. 두통약 과다복용 걱정
insert into public.consultations (id, user_id, content, status, ai_report, ai_report_at, answer, answered_at, verified_by, verified_at, created_at, updated_at)
values (
  gen_random_uuid(), real_user_id,
  '편두통이 잦아서 일주일에 3~4번 정도 진통제를 먹고 있어요. 이부프로펜 400mg을 주로 먹는데, 이렇게 자주 먹어도 괜찮을까요?',
  'answered',
  '[요약]
일주일에 3~4회 이상 진통제를 복용하는 것은 "약물 과용 두통(MOH)"을 유발할 수 있어 주의가 필요합니다. 진통제를 줄이면서 두통의 근본 원인을 찾는 것이 중요합니다.

[위험성 분석]
- 한 달 15일 이상 진통제 복용 시 약물 과용 두통 진단 기준 해당
- 이부프로펜 장기 복용 시 위장관 출혈, 신장 기능 저하 위험
- 진통제에 대한 의존성이 생겨 점점 더 자주, 더 많이 복용하게 되는 악순환

[주의사항]
- 위장 보호를 위해 반드시 식후에 복용
- 공복 복용 시 위궤양, 위출혈 위험 크게 증가
- 음주와 병용 시 위장관 부작용 위험 배가

[권장사항]
- 신경과 또는 두통 전문 클리닉 방문하여 편두통 예방 치료 상담
- 트립탄 계열 편두통 전용약 처방 검토 (더 효과적)
- 두통 일기 작성: 발생 시간, 강도, 유발 요인 기록
- 카페인, 수면 부족, 스트레스 등 유발 요인 관리',
  now() - interval '5 hours',
  '주 3~4회 진통제 복용은 약물 과용 두통의 위험이 높습니다. 신경과 방문을 꼭 권합니다. 편두통 예방약(토피라메이트, 프로프라놀롤 등)을 처방받으면 진통제 사용을 크게 줄일 수 있어요.',
  now() - interval '4 hours',
  real_user_id,
  now() - interval '3 hours',
  now() - interval '5 hours',
  now() - interval '3 hours'
);

-- 12. 갑상선약 복용법
insert into public.consultations (id, user_id, content, status, ai_report, ai_report_at, answer, answered_at, verified_by, verified_at, created_at, updated_at)
values (
  gen_random_uuid(), real_user_id,
  '갑상선기능저하증으로 레보티록신(씬지로이드)을 먹고 있어요. 아침에 공복에 먹으라고 하셨는데, 커피를 같이 마셔도 되나요? 약 먹고 바로 커피를 마시거든요.',
  'answered',
  '[요약]
레보티록신은 커피와 함께 복용하면 흡수율이 크게 감소합니다. 약 복용 후 최소 30분~1시간 후에 커피를 마시는 것을 권장합니다.

[상호작용 분석]
- 커피의 카페인과 클로로겐산이 레보티록신의 장 흡수를 방해
- 커피와 함께 복용 시 약물 흡수율이 최대 36% 감소
- 갑상선 호르몬 수치 조절이 어려워져 용량 조절이 필요할 수 있음

[복용 가이드]
- 기상 직후 빈속에 물과 함께 레보티록신 복용
- 복용 후 최소 30분 (이상적으로는 1시간) 후 커피/식사
- 칼슘, 철분, 제산제와는 4시간 이상 간격 유지

[권장사항]
- 매일 같은 시간에 복용하여 일정한 혈중 농도 유지
- 약을 먹는 것을 잊었다면 생각난 즉시 복용 (다음 날 분과 합치지 않기)
- 정기적으로 TSH 검사를 통해 용량 적절성 확인',
  now() - interval '2 hours',
  null,
  null,
  real_user_id,
  now() - interval '1 hour',
  now() - interval '2 hours',
  now() - interval '1 hour'
);

end;
$$ language plpgsql security definer;

-- 실행
select seed_public_consultations();

-- 함수 정리
drop function seed_public_consultations();
