function AcademicLife({ formData, handleChange, errors }) {
  return (
    <div className="step-content fade-in">
      <div className="form-grid">
        <div
          className={`form-group ${
            errors.study_hours_per_day ? "has-error" : ""
          }`}
        >
          <label htmlFor="field-study_hours">
            Study Hours Per Day <span className="req">*</span>
          </label>
          <input
            id="field-study_hours"
            type="number"
            name="study_hours_per_day"
            min="0"
            max="13.91"
            step="0.1"
            value={formData.study_hours_per_day}
            onChange={handleChange}
            placeholder="Example: 6.5"
            required
          />
          <div className="field-hint">Daily study time (0 – 13.91 hrs)</div>
          {errors.study_hours_per_day && (
            <div className="error-message">
              {errors.study_hours_per_day}
            </div>
          )}
        </div>

        <div
          className={`form-group ${errors.exam_pressure ? "has-error" : ""}`}
        >
          <label htmlFor="field-exam_pressure">
            Exam Pressure (1–10) <span className="req">*</span>
          </label>
          <input
            id="field-exam_pressure"
            type="number"
            name="exam_pressure"
            min="1"
            max="10"
            step="0.1"
            value={formData.exam_pressure}
            onChange={handleChange}
            placeholder="Rate from 1 to 10"
            required
          />
          <div className="field-hint">Perceived pressure scale (1 – 10)</div>
          {errors.exam_pressure && (
            <div className="error-message">{errors.exam_pressure}</div>
          )}
        </div>

        <div
          className={`form-group ${
            errors.academic_performance ? "has-error" : ""
          }`}
        >
          <label htmlFor="field-academic_performance">
            Academic Performance (%) <span className="req">*</span>
          </label>
          <input
            id="field-academic_performance"
            type="number"
            name="academic_performance"
            min="48.35"
            max="97.25"
            step="0.01"
            value={formData.academic_performance}
            onChange={handleChange}
            placeholder="Example: 77"
            required
          />
          <div className="field-hint">Average score percentage (48.35% – 97.25%)</div>
          {errors.academic_performance && (
            <div className="error-message">
              {errors.academic_performance}
            </div>
          )}
        </div>

        <div
          className={`form-group ${
            errors.family_expectation ? "has-error" : ""
          }`}
        >
          <label htmlFor="field-family_expectation">
            Family Expectation (0–10) <span className="req">*</span>
          </label>
          <input
            id="field-family_expectation"
            type="number"
            name="family_expectation"
            min="0"
            max="10"
            step="0.1"
            value={formData.family_expectation}
            onChange={handleChange}
            placeholder="Rate from 0 to 10"
            required
          />
          <div className="field-hint">Expectation level scale (0 – 10)</div>
          {errors.family_expectation && (
            <div className="error-message">
              {errors.family_expectation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AcademicLife;
