# 📋 Bulk Question Upload Template

## Required Excel Format (.xlsx)

### Column Headers (EXACT):

| Column Name    | Required | Example         | Description                                     |
| -------------- | -------- | --------------- | ----------------------------------------------- |
| Question       | ✅       | "What is 2+2?"  | The question text                               |
| Option A       | ✅       | "4"             | First option                                    |
| Option B       | ✅       | "5"             | Second option                                   |
| Option C       | ❌       | "6"             | Third option (optional)                         |
| Option D       | ❌       | "7"             | Fourth option (optional)                        |
| Correct Answer | ✅       | "A"             | Must be A, B, C, D, 1, 2, 3, or 4               |
| Explanation    | ❌       | "Because 2+2=4" | Why answer is correct (optional)                |
| Topic          | ✅       | "Algebra"       | Topic name (must exist)                         |
| Subject        | ❌       | "Mathematics"   | Subject name (optional, helps find right topic) |

### 📝 Example Row:

| Question     | Option A | Option B | Option C | Option D | Correct Answer | Explanation    | Topic   | Subject     |
| ------------ | -------- | -------- | -------- | -------- | -------------- | -------------- | ------- | ----------- |
| What is 2+2? | 4        | 5        | 6        | 7        | A              | Basic addition | Algebra | Mathematics |

### ⚠️ Important Rules:

1. **Question** column is mandatory
2. **Correct Answer** column is mandatory
3. **At least 2 options** required (Option A + Option B minimum)
4. **Valid answers**: A, B, C, D, 1, 2, 3, 4 only
5. **Maximum 500 questions** per file
6. **No duplicate questions** (checked by content hash)
7. **Empty rows are ignored**
8. **Topic must exist** in your system
9. **Subject helps identify** the right topic if multiple exist

### 🚀 Upload Process:

1. Questions are created in the **Question Bank**
2. If **sectionId** provided → Questions linked to that section
3. If **no sectionId** → Questions created in bank only
4. **Ghost Question Guard**: All questions require a valid topic

### 📋 Download Template:

Create an Excel file with these exact headers:

```
Question,Option A,Option B,Option C,Option D,Correct Answer,Explanation,Topic,Subject
"What is 2+2?","4","5","6","7","A","Basic addition","Algebra","Mathematics"
"What is 3+3?","6","7","8","9","A","Basic addition","Algebra","Mathematics"
```

### 🔧 Subject Management:

Use the new **Subject Management** page in admin dashboard to:

1. Create subjects (Mathematics, Physics, Chemistry, etc.)
2. Create topics under subjects (Algebra under Mathematics)
3. Then upload questions with proper topic references

This ensures proper hierarchy:

```
Subject: Mathematics
  ↓
Topic: Algebra
  ↓
Question: What is 2+2?
```

### 🎯 Best Practices:

1. **Always include Subject** column to avoid topic conflicts
2. **Use consistent topic names** across uploads
3. **Test with small batches** first (5-10 questions)
4. **Check topic existence** before bulk upload
5. **Use proper formatting** for Excel cells (no extra spaces)

This template works for both:

- ✅ **General Upload** (creates questions in bank)
- ✅ **Test-specific Upload** (links questions to a section)
