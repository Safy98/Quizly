from app import create_app
'''
Add docstrings to classes and methods
Consider using Swagger/OpenAPI for API documentation
'''
app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
