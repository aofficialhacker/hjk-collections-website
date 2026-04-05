<?php

class Validator
{
    private $errors = [];
    private $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function required($field, $label = null)
    {
        $label = $label ?: $field;
        if (!isset($this->data[$field]) || trim($this->data[$field]) === '') {
            $this->errors[$field] = "$label is required";
        }
        return $this;
    }

    public function email($field, $label = null)
    {
        $label = $label ?: $field;
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            if (!filter_var($this->data[$field], FILTER_VALIDATE_EMAIL)) {
                $this->errors[$field] = "Invalid $label format";
            }
        }
        return $this;
    }

    public function phone($field, $label = null)
    {
        $label = $label ?: $field;
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            if (!preg_match('/^[6-9]\d{9}$/', $this->data[$field])) {
                $this->errors[$field] = "Invalid $label (10-digit Indian number required)";
            }
        }
        return $this;
    }

    public function pincode($field, $label = null)
    {
        $label = $label ?: $field;
        if (isset($this->data[$field]) && !empty($this->data[$field])) {
            if (!preg_match('/^\d{6}$/', $this->data[$field])) {
                $this->errors[$field] = "Invalid $label (6 digits required)";
            }
        }
        return $this;
    }

    public function minLength($field, $min, $label = null)
    {
        $label = $label ?: $field;
        if (isset($this->data[$field]) && strlen($this->data[$field]) < $min) {
            $this->errors[$field] = "$label must be at least $min characters";
        }
        return $this;
    }

    public function maxLength($field, $max, $label = null)
    {
        $label = $label ?: $field;
        if (isset($this->data[$field]) && strlen($this->data[$field]) > $max) {
            $this->errors[$field] = "$label must not exceed $max characters";
        }
        return $this;
    }

    public function numeric($field, $label = null)
    {
        $label = $label ?: $field;
        if (isset($this->data[$field]) && !is_numeric($this->data[$field])) {
            $this->errors[$field] = "$label must be a number";
        }
        return $this;
    }

    public function in($field, $values, $label = null)
    {
        $label = $label ?: $field;
        if (isset($this->data[$field]) && !in_array($this->data[$field], $values)) {
            $this->errors[$field] = "Invalid $label value";
        }
        return $this;
    }

    public function fails()
    {
        return !empty($this->errors);
    }

    public function errors()
    {
        return $this->errors;
    }

    public function firstError()
    {
        return reset($this->errors);
    }

    public static function sanitize($value)
    {
        return htmlspecialchars(trim($value), ENT_QUOTES, 'UTF-8');
    }

    public static function getInput()
    {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

        if (stripos($contentType, 'application/json') !== false) {
            $input = json_decode(file_get_contents('php://input'), true);
            return $input ?: [];
        }

        return $_POST;
    }
}
