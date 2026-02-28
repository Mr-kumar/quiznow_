import { ValidationException } from '../exceptions/app.exception';

/**
 * Validates answer submission data
 * Used in attempts.service.ts to ensure answer integrity
 */
export class AnswerValidator {
  /**
   * Validates that selectedOptionIndex is within bounds
   */
  static validateAnswerBounds(
    selectedOptionIndex: number | null | undefined,
    totalOptions: number,
    questionId: string,
  ): void {
    if (selectedOptionIndex === null || selectedOptionIndex === undefined) {
      return; // Answer can be skipped
    }

    if (
      !Number.isInteger(selectedOptionIndex) ||
      selectedOptionIndex < 0 ||
      selectedOptionIndex >= totalOptions
    ) {
      throw new ValidationException(
        `Invalid answer for question ${questionId}: option index ${selectedOptionIndex} out of bounds (0-${totalOptions - 1})`,
        'INVALID_ANSWER_INDEX',
      );
    }
  }

  /**
   * Validates entire answer set for duplicates and bounds
   */
  static validateAnswerSet(
    answers: Array<{ questionId: string; selectedOptionIndex: number | null }>,
    questionMap: Map<string, { totalOptions: number; correctAnswer: number }>,
  ): string[] {
    const seenQuestions = new Set<string>();
    const duplicateQuestions: string[] = [];

    for (const answer of answers) {
      // Check for duplicates
      if (seenQuestions.has(answer.questionId)) {
        duplicateQuestions.push(answer.questionId);
      }
      seenQuestions.add(answer.questionId);

      // Check if question exists
      const question = questionMap.get(answer.questionId);
      if (!question) {
        continue; // Question doesn't exist in this test, will be skipped
      }

      // Validate bounds
      this.validateAnswerBounds(
        answer.selectedOptionIndex,
        question.totalOptions,
        answer.questionId,
      );
    }

    if (duplicateQuestions.length > 0) {
      throw new ValidationException(
        `Duplicate answers for questions: ${duplicateQuestions.join(', ')}`,
        'DUPLICATE_ANSWERS',
      );
    }

    return duplicateQuestions;
  }
}

/**
 * Validates test configuration
 */
export class TestValidator {
  /**
   * Validates test schedule (startAt, endAt)
   */
  static validateSchedule(startAt?: Date, endAt?: Date): void {
    if (startAt && endAt) {
      if (startAt >= endAt) {
        throw new ValidationException(
          'Test start time must be before end time',
          'INVALID_TEST_SCHEDULE',
        );
      }
    }

    // Check if start time is in the past
    if (startAt && new Date() > startAt) {
      throw new ValidationException(
        'Test start time cannot be in the past',
        'PAST_START_TIME',
      );
    }
  }

  /**
   * Validates test duration
   */
  static validateDuration(durationMins: number): void {
    if (durationMins <= 0 || durationMins > 600) {
      throw new ValidationException(
        'Test duration must be between 1 and 600 minutes',
        'INVALID_DURATION',
      );
    }
  }

  /**
   * Validates test marks
   */
  static validateMarks(
    totalMarks: number,
    passingMarks: number,
    positiveMark: number,
    negativeMark: number,
  ): void {
    if (totalMarks <= 0) {
      throw new ValidationException(
        'Total marks must be greater than 0',
        'INVALID_TOTAL_MARKS',
      );
    }

    if (passingMarks < 0 || passingMarks > totalMarks) {
      throw new ValidationException(
        'Passing marks must be between 0 and total marks',
        'INVALID_PASSING_MARKS',
      );
    }

    if (positiveMark <= 0) {
      throw new ValidationException(
        'Positive marks must be greater than 0',
        'INVALID_POSITIVE_MARK',
      );
    }

    if (negativeMark < 0) {
      throw new ValidationException(
        'Negative marks cannot be negative',
        'INVALID_NEGATIVE_MARK',
      );
    }
  }
}
