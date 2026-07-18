# Run this from inside your grade5-imo-quiz folder:
#   .\verify-project.ps1
#
# Checks every file that's caused a problem so far, all at once,
# instead of discovering them one at a time.

$files = @(
    "app\layout.js",
    "app\page.js",
    "app\icon.png",
    "app\login\page.js",
    "app\dashboard\page.js",
    "app\dashboard\DashboardClient.js",
    "app\admin\page.js",
    "app\admin\AdminDashboardClient.js",
    "app\admin\UnlocksTab.js",
    "app\admin\QuestionsTab.js",
    "app\admin\QuestionForm.js",
    "app\admin\ResultsTab.js",
    "app\admin\AdminAttemptReview.js",
    "app\quiz\[grade]\[subject]\[setLabel]\page.js",
    "app\quiz\[grade]\[subject]\[setLabel]\QuizClient.js",
    "app\results\[attemptId]\page.js",
    "app\results\[attemptId]\ResultsClient.js",
    "app\review\[attemptId]\page.js",
    "app\review\[attemptId]\ReviewClient.js",
    "app\api\auth\[...nextauth]\route.js",
    "app\api\catalog\route.js",
    "app\api\attempts\route.js",
    "app\api\attempts\[id]\route.js",
    "app\api\quiz\[grade]\[subject]\[setLabel]\route.js",
    "app\api\quiz\[grade]\[subject]\[setLabel]\submit\route.js",
    "app\api\admin\students\route.js",
    "app\api\admin\students\[username]\route.js",
    "app\api\admin\students\[username]\attempts\route.js",
    "app\api\admin\questions\route.js",
    "app\api\admin\questions\[id]\route.js",
    "app\api\admin\unlocks\route.js",
    "app\api\admin\results\route.js",
    "app\api\admin\attempts\[id]\route.js",
    "app\api\admin\export\route.js",
    "components\ui.jsx",
    "components\Providers.js",
    "lib\authOptions.js",
    "lib\badges.js",
    "lib\catalog.js",
    "lib\diagramTemplates.js",
    "lib\quizData.js",
    "lib\questionValidation.js",
    "lib\supabaseAdmin.js",
    "lib\unlocks.js",
    "middleware.js",
    "next.config.js",
    "package.json",
    "public\techsei-icon.png",
    "public\techsei-logo.png",
    "supabase\schema.sql",
    "supabase\migration_002_questions.sql",
    "supabase\migration_003_grades_and_unlocks.sql",
    "supabase\migration_004_question_marks.sql"
)

# Also make sure these OLD, now-obsolete paths are gone — if they
# still exist, they're stale leftovers that can cause build errors
# or route conflicts.
$shouldNotExist = @(
    "app\quiz\[setLabel]",
    "app\api\quiz\[setLabel]"
)

Write-Host "`n=== Checking required files ===" -ForegroundColor Cyan
$missing = 0
foreach ($f in $files) {
    if (Test-Path $f) {
        Write-Host "OK    $f" -ForegroundColor Green
    } else {
        Write-Host "MISSING  $f" -ForegroundColor Red
        $missing++
    }
}

Write-Host "`n=== Checking for stale old files (should NOT exist) ===" -ForegroundColor Cyan
$stale = 0
foreach ($f in $shouldNotExist) {
    if (Test-Path $f) {
        Write-Host "STALE - DELETE THIS:  $f" -ForegroundColor Yellow
        $stale++
    } else {
        Write-Host "OK (correctly absent)  $f" -ForegroundColor Green
    }
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Missing required files: $missing"
Write-Host "Stale files to delete:  $stale"
if ($missing -eq 0 -and $stale -eq 0) {
    Write-Host "`nEverything checks out. If the app still misbehaves, the issue is elsewhere (env vars, Supabase, or a code difference rather than a missing file)." -ForegroundColor Green
} else {
    Write-Host "`nSomething's off. Easiest fix: delete this whole project folder and unzip the fresh copy from scratch." -ForegroundColor Yellow
}
