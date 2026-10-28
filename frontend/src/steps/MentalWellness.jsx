function MentalWellness({ formData, handleChange, errors }) {
  return (
    <div className="step-content fade-in">
      <div className="form-grid">
        <div
          className={`form-group ${errors.stress_level ? "has-error" : ""}`}
        >
          <label htmlFor="field-stress_level">
            Stress Level (0–10) <span className="req">*</span>
          </label>
          <input
            id="field-stress_level"
            type="number"
            name="stress_level"
            min="0"
            max="10"
            step="0.1"
            value={formData.stress_level}
            onChange={handleChange}
            placeholder="Rate from 0 to 10"
            required
          />
          <div className="field-hint">Overall stress scale (0 – 10)</div>
          {errors.stress_level && (
            <div className="error-message">{errors.stress_level}</div>
          )}
        </div>

        <div
          className={`form-group ${errors.anxiety_score ? "has-error" : ""}`}
        >
          <label htmlFor="field-anxiety_score">
            Anxiety Score <span className="req">*</span>
          </label>
          <input
            id="field-anxiety_score"
            type="number"
            name="anxiety_score"
            min="0"
            max="9.11"
            step="0.01"
            value={formData.anxiety_score}
            onChange={handleChange}
            placeholder="Enter your score"
            required
          />
          <div className="field-hint">Anxiety index scale (0 – 9.11)</div>
          {errors.anxiety_score && (
            <div className="error-message">{errors.anxiety_score}</div>
          )}
        </div>

        <div
          className={`form-group ${
            errors.depression_score ? "has-error" : ""
          }`}
        >
          <label htmlFor="field-depression_score">
            Depression Score <span className="req">*</span>
          </label>
          <input
            id="field-depression_score"
            type="number"
            name="depression_score"
            min="0"
            max="7.74"
            step="0.01"
            value={formData.depression_score}
            onChange={handleChange}
            placeholder="Enter your score"
            required
          />
          <div className="field-hint">Depression index scale (0 – 7.74)</div>
          {errors.depression_score && (
            <div className="error-message">
              {errors.depression_score}
            </div>
          )}
        </div>

        <div
          className={`form-group ${
            errors.social_support ? "has-error" : ""
          }`}
        >
          <label htmlFor="field-social_support">
            Social Support (0–10) <span className="req">*</span>
          </label>
          <input
            id="field-social_support"
            type="number"
            name="social_support"
            min="0"
            max="10"
            step="0.1"
            value={formData.social_support}
            onChange={handleChange}
            placeholder="Rate from 0 to 10"
            required
          />
          <div className="field-hint">Perceived support system (0 – 10)</div>
          {errors.social_support && (
            <div className="error-message">{errors.social_support}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MentalWellness;
