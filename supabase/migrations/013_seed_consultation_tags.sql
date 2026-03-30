-- 시드 상담 데이터에 태그 추가
-- content 기반으로 매칭하여 태그 할당

-- 1. 고혈압약 + 자몽
update public.consultations
  set tags = array['혈압약', '상호작용', '음식궁합', '고혈압', '복용법']
  where content like '%암로디핀%자몽%';

-- 2. 비타민D + 칼슘
update public.consultations
  set tags = array['비타민D', '칼슘', '복용법', '골다공증', '영양제']
  where content like '%비타민D%칼슘%';

-- 3. 타이레놀 + 술
update public.consultations
  set tags = array['진통제', '해열제', '음주', '부작용', '복용법']
  where content like '%타이레놀%숙취%' or content like '%아세트아미노펜%술%';

-- 4. 임산부 엽산 + 철분
update public.consultations
  set tags = array['엽산', '철분', '임산부', '복용법', '복용시간']
  where content like '%임신%엽산%철분%';

-- 5. 오메가3 + 혈압약
update public.consultations
  set tags = array['오메가3', '혈압약', '상호작용', '고혈압', '복용법']
  where content like '%오메가3%로사르탄%';

-- 6. 항생제 + 유산균
update public.consultations
  set tags = array['항생제', '유산균', '복용시간', '상호작용', '장기복용']
  where content like '%항생제%유산균%';

-- 7. 수면제 + 멜라토닌
update public.consultations
  set tags = array['수면제', '멜라토닌', '상호작용', '불면', '부작용']
  where content like '%졸피뎀%멜라토닌%';

-- 8. 아이 해열제 교차
update public.consultations
  set tags = array['해열제', '진통제', '소아', '교차투여', '용량']
  where content like '%3살%해열%' or content like '%부루펜%교차%';

-- 9. 당뇨약 + 홍삼
update public.consultations
  set tags = array['당뇨약', '홍삼', '상호작용', '당뇨', '부작용']
  where content like '%메트포르민%홍삼%';

-- 10. 여드름약 + 비타민A
update public.consultations
  set tags = array['여드름약', '피부과약', '멀티비타민', '부작용', '중복복용']
  where content like '%이소트레티노인%비타민A%';

-- 11. 진통제 과다복용
update public.consultations
  set tags = array['진통제', '편두통', '과다복용', '장기복용', '부작용']
  where content like '%편두통%진통제%';

-- 12. 갑상선약 + 커피
update public.consultations
  set tags = array['갑상선약', '카페인', '복용시간', '갑상선질환', '음식궁합']
  where content like '%레보티록신%커피%';
