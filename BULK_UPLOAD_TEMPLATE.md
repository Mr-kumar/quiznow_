# 📋 Bulk Question Upload Template

## Required Excel Format (.xlsx)

### Column Headers (EXACT):
| Column Name | Required | Example | Description |
|-------------|----------|---------|-------------|
| Question | ✅ | "What is 2+2?" | The question text |
| Option A | ✅ | "4" | First option |
| Option B | ✅ | "5" | Second option |
| Option C | ❌ | "6" | Third option (optional) |
| Option D | ❌ | "7" | Fourth option (optional) |
| Correct Answer | ✅ | "A" | Must be A, B, C, D, 1, 2, 3, or 4 |
| Explanation | ❌ | "Because 2+2=4" | Why answer is correct (optional) |

### 📝 Example Row:
| Question | Option A | Option B | Option C | Option D | Correct Answer | Explanation |
|----------|----------|----------|----------|----------|---------------|------------|
| What is 2+2? | 4 | 5 | 6 | 7 | A | Basic addition |

### 📋 Download Template:
[Download Template.xlsx](data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,UEsDBAoAAAAA...create downloadable template...)

### ⚠️ Important Rules:
1. **Question** column is mandatory
2. **Correct Answer** column is mandatory  
3. **At least 2 options** required (Option A + Option B minimum)
4. **Valid answers**: A, B, C, D, 1, 2, 3, 4 only
5. **Maximum 500 questions** per file
6. **No duplicate questions** (checked by content hash)
7. **Empty rows are ignored**

### 🚀 Upload Process:
1. Questions are created in the **Question Bank** (not linked to any test)
2. You can later **link** these questions to specific tests/sections
3. **Ghost Question Guard**: All questions require a topic (assigned automatically)

This template works for both:
- ✅ **General Upload** (creates questions in bank)
- ✅ **Test-specific Upload** (links questions to a section)
