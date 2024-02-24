function escape(value) {
    // Replace special characters with underscores or other suitable characters
    return value.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, '_');
  }
