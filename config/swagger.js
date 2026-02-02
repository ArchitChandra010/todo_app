const swaggerJsDoc = require("swagger-jsdoc");

const options = {
    definition :
    {
        openapi : "3.0.0",
        info: {
            title: "Todo App API",
            version: "1.0.0",
            description: "JWT + Redis + Rate Limited Todo Backend API"
        },

        servers: [
            {
                url: "http://localhost:8000"
            }
        ],

        components:
        {
            securitySchemes:
            {
                bearerAuth:
                {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        },

        security: [
            {
                bearerAuth: []
            }
        ]
    
    },

    apis: [
        "./routes/*.js",
        "./controllers/*.js"
    ]
};

module.exports = swaggerJsDoc(options);