<?php

class Response
{
    public static function success($data = null, $message = 'Success', $code = 200)
    {
        http_response_code($code);
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data
        ]);
        exit;
    }

    public static function error($message = 'Error', $code = 400, $errors = null)
    {
        http_response_code($code);
        $response = [
            'success' => false,
            'message' => $message
        ];
        if ($errors !== null) {
            $response['errors'] = $errors;
        }
        echo json_encode($response);
        exit;
    }

    public static function paginated($data, $total, $page, $perPage)
    {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $data,
            'pagination' => [
                'total' => (int)$total,
                'page' => (int)$page,
                'perPage' => (int)$perPage,
                'totalPages' => ceil($total / $perPage)
            ]
        ]);
        exit;
    }
}
