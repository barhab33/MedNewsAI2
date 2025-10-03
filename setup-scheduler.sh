#!/bin/bash

echo "=========================================="
echo "Automated News Scheduler Setup"
echo "=========================================="
echo ""

# Check if running on Linux/Mac or Windows
if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Detected: Linux/Mac"
    echo ""
    echo "Setting up cron job to run every 5 hours..."
    echo ""

    # Get the current directory
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

    # Create logs directory
    mkdir -p "$SCRIPT_DIR/logs"

    # Backup existing crontab
    crontab -l > /tmp/crontab.backup 2>/dev/null || true

    # Add new cron job
    (crontab -l 2>/dev/null || true; echo "0 */5 * * * cd $SCRIPT_DIR && /usr/bin/node auto-scheduler.cjs >> logs/scheduler.log 2>&1") | crontab -

    echo "✓ Cron job added successfully!"
    echo ""
    echo "The system will now automatically:"
    echo "  - Fetch news every 5 hours"
    echo "  - Process articles with AI"
    echo "  - Update your website"
    echo ""
    echo "Logs will be saved to: $SCRIPT_DIR/logs/scheduler.log"
    echo ""
    echo "To view the cron job:"
    echo "  crontab -l"
    echo ""
    echo "To remove the cron job:"
    echo "  crontab -e"
    echo ""
    echo "To test manually:"
    echo "  node auto-scheduler.cjs"
    echo ""

else
    echo "Detected: Windows"
    echo ""
    echo "Windows Task Scheduler Setup:"
    echo ""
    echo "1. Open Task Scheduler"
    echo "2. Click 'Create Task'"
    echo "3. Name: 'Medical AI News Update'"
    echo "4. Triggers: New → Repeat every 5 hours"
    echo "5. Actions: New → Start a program"
    echo "   - Program: node"
    echo "   - Arguments: auto-scheduler.cjs"
    echo "   - Start in: $(pwd)"
    echo "6. Click OK to save"
    echo ""
    echo "Or use this PowerShell command (run as Administrator):"
    echo ""
    echo "\$action = New-ScheduledTaskAction -Execute 'node' -Argument 'auto-scheduler.cjs' -WorkingDirectory '$(pwd)'"
    echo "\$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 5)"
    echo "Register-ScheduledTask -TaskName 'MedicalAINews' -Action \$action -Trigger \$trigger"
    echo ""
fi

echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Your website will now update automatically every 5 hours."
echo ""
echo "Next steps:"
echo "  1. Test: node auto-scheduler.cjs"
echo "  2. Check admin dashboard: /admin.html"
echo "  3. Monitor logs for successful updates"
echo ""
