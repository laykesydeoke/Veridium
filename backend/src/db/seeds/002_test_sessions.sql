-- Seed test sessions for development
INSERT INTO sessions (
  session_address,
  topic,
  description,
  initiator_address,
  challenger_address,
  wager_amount,
  status,
  start_time,
  voting_end_time
)
VALUES
  (
    '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'Is decentralized governance more effective than traditional systems?',
    'A deep dive into the pros and cons of DAO governance versus traditional corporate/governmental structures',
    '0x1111111111111111111111111111111111111111',
    '0x2222222222222222222222222222222222222222',
    '1000000000000000000',
    'voting',
    NOW() - INTERVAL '2 hours',
    NOW() + INTERVAL '22 hours'
  ),
  (
    '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    'Should AI development be regulated by governments?',
    'Exploring the balance between innovation and safety in AI development',
    '0x3333333333333333333333333333333333333333',
    '0x4444444444444444444444444444444444444444',
    '500000000000000000',
    'active',
    NOW() - INTERVAL '30 minutes',
    NULL
  ),
  (
    '0xcccccccccccccccccccccccccccccccccccccccc',
    'Is blockchain technology truly decentralized?',
    'Examining the centralization concerns in modern blockchain systems',
    '0x2222222222222222222222222222222222222222',
    NULL,
    '2000000000000000000',
    'pending',
    NULL,
    NULL
  )
ON CONFLICT (session_address) DO NOTHING;

-- Seed session participants
INSERT INTO session_participants (session_id, user_address, role)
SELECT s.id, '0x1111111111111111111111111111111111111111', 'initiator'
FROM sessions s WHERE s.session_address = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
ON CONFLICT DO NOTHING;

INSERT INTO session_participants (session_id, user_address, role)
SELECT s.id, '0x2222222222222222222222222222222222222222', 'challenger'
FROM sessions s WHERE s.session_address = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
ON CONFLICT DO NOTHING;

INSERT INTO session_participants (session_id, user_address, role)
SELECT s.id, '0x5555555555555555555555555555555555555555', 'evaluator'
FROM sessions s WHERE s.session_address = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
ON CONFLICT DO NOTHING;

-- Seed arguments
INSERT INTO arguments (session_id, author_address, side, content, upvotes)
SELECT
  s.id,
  '0x1111111111111111111111111111111111111111',
  'initiator',
  'Decentralized governance removes single points of failure and enables truly democratic decision-making through transparent on-chain voting.',
  15
FROM sessions s WHERE s.session_address = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

INSERT INTO arguments (session_id, author_address, side, content, upvotes)
SELECT
  s.id,
  '0x2222222222222222222222222222222222222222',
  'challenger',
  'Traditional governance has centuries of refinement and accountability mechanisms that DAOs cannot yet match. Voter apathy and plutocracy remain issues.',
  12
FROM sessions s WHERE s.session_address = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
