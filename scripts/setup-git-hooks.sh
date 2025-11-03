#!/bin/bash
#
# Git Hooks Setup Script for Serenity ERP
# Installs pre-commit hooks to prevent production issues
#

echo "🔧 Setting up Git hooks for Serenity ERP..."

# Create .git/hooks directory if it doesn't exist
mkdir -p .git/hooks

# Copy pre-commit hook
if [ -f ".github/hooks/pre-commit" ]; then
    cp .github/hooks/pre-commit .git/hooks/pre-commit
    chmod +x .git/hooks/pre-commit
    echo "✅ Pre-commit hook installed"
else
    echo "❌ Error: .github/hooks/pre-commit not found"
    exit 1
fi

# Test the hook
echo "🧪 Testing pre-commit hook..."
if .git/hooks/pre-commit; then
    echo "✅ Pre-commit hook test passed"
else
    echo "⚠️  Pre-commit hook test failed (expected if there are violations)"
fi

echo ""
echo "🎉 Git hooks setup complete!"
echo ""
echo "The pre-commit hook will now:"
echo "  • Block console statements"
echo "  • Detect PHI patterns"
echo "  • Check for secrets"
echo "  • Validate TypeScript compilation"
echo "  • Run ESLint checks"
echo ""
echo "To bypass hooks (emergency only): git commit --no-verify"