import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "BasketRadar API Specification",
      version: "1.0.0",
      description:
        "Production-ready retail price-comparison, store locator, catalogue browsing, and smart shopping list API platform.",
      contact: {
        name: "BasketRadar Developer Team",
        email: "support@basketradar.com",
      },
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Local Development Server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Enter your JWT access token in the format: Bearer <token>",
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ["./src/modules/**/*.ts", "./src/routes.ts"], // Path to files containing JSDoc annotations
};

export const swaggerSpec = swaggerJSDoc(options);
