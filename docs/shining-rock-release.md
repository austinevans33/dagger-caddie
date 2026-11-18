# Shining Rock release qualification

Draft qualification only. Production promotion requires owner approval after acceptance.

The source is PR #103's immutable runtime commit 7a24d01ebfa74d502a33751ebe73178308237de8. The release builder retains the 61f9e9de0a staging runtime, replaces only the five explicitly listed successor surfaces, pins the two historical Clubhouse hotfixes to the same source, and compares every runtime byte. The public source marker identifies the successor commit. The protected manifest, original brand assets and production Firebase client configuration still come from 390b501.

Backend source compares against pre-release main 4297e42691e4167ec27cf003656d084b0f8943ac. Earlier Tournament HQ source additions already exist on main. They stay in Git and outside the public Pages output. This release neither certifies nor deploys those backend additions. No workflow in this PR deploys Firebase or changes Pages settings.

## Acceptance still required

- Original House Ghost on the actual iPhone, from first-launch course/tee selection through completion, close/reopen and archive.
- Two physical iPhones using the candidate with staging services. Host creates a disposable Money Room, guest joins, host enters and corrects scores, both reload/reconnect, host finishes, and both verify identical final balances and one archive record.
- Ticket Window currently has device-local side bets, manual result resolution and explicit Mark paid confirmation. It has no remote ticket acceptance or shared ticket synchronization. Joining a Money Room does not certify acceptance of a Ticket Window bet. Ghost archives do not settle real wagers automatically. Those gaps block the owner's requested shared-ticket lifecycle.
- The separate-origin rehearsal does not certify the existing installed production shortcut. Follow the origin-preserving rehearsal and backup steps in production-promotion.md before approving production.
- Record tested head, iPhone/iOS versions, account/room test identifiers and results before the owner gives final promotion approval.

## Rollback

Promote as one squash unit only after all gates and explicit approval. Revert that unit through a rollback PR to restore pre-release main. Keep the current Pages root and all Firebase/browser records. The updated --verify-rollback command checks the pre-release runtime and root pages against 4297e426, including the retained brand assets. Verify the installed shortcut after Pages finishes publishing.
