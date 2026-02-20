import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any

class TodoAPITester:
    def __init__(self, base_url="https://task-management-demo.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_todos = []

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params or {})
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"   ✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if method == 'POST' and 'id' in response_data:
                        self.created_todos.append(response_data['id'])
                    return success, response_data
                except:
                    return success, {}
            else:
                print(f"   ❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"   ❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_create_todo(self, title="Test Todo", description="Test Description", priority="high", status="pending"):
        """Test creating a todo"""
        todo_data = {
            "title": title,
            "description": description,
            "due_date": "2024-12-31",
            "priority": priority,
            "status": status
        }
        success, response = self.run_test("Create Todo", "POST", "todos", 200, data=todo_data)
        return success, response.get('id') if success else None

    def test_get_todos(self):
        """Test getting all todos"""
        return self.run_test("Get All Todos", "GET", "todos", 200)

    def test_get_todos_with_filters(self):
        """Test getting todos with filters"""
        filters = [
            {"status": "pending"},
            {"priority": "high"},
            {"search": "Test"}
        ]
        
        results = []
        for filter_param in filters:
            filter_name = list(filter_param.keys())[0]
            success, response = self.run_test(
                f"Get Todos - Filter by {filter_name}", 
                "GET", 
                "todos", 
                200, 
                params=filter_param
            )
            results.append(success)
        
        return all(results)

    def test_get_todo_by_id(self, todo_id):
        """Test getting a specific todo by ID"""
        if not todo_id:
            print("❌ Cannot test get todo - no valid todo ID")
            return False
        return self.run_test("Get Todo by ID", "GET", f"todos/{todo_id}", 200)

    def test_update_todo(self, todo_id):
        """Test updating a todo"""
        if not todo_id:
            print("❌ Cannot test update todo - no valid todo ID")
            return False
        
        update_data = {
            "title": "Updated Test Todo",
            "description": "Updated Description",
            "status": "completed"
        }
        success, response = self.run_test("Update Todo", "PUT", f"todos/{todo_id}", 200, data=update_data)
        return success

    def test_delete_todo(self, todo_id):
        """Test deleting a todo"""
        if not todo_id:
            print("❌ Cannot test delete todo - no valid todo ID")
            return False
        return self.run_test("Delete Todo", "DELETE", f"todos/{todo_id}", 200)

    def test_get_summary(self):
        """Test getting todos summary/insights"""
        return self.run_test("Get Summary/Insights", "GET", "todos/summary", 200)

    def cleanup_created_todos(self):
        """Clean up any todos created during testing"""
        print(f"\n🧹 Cleaning up {len(self.created_todos)} created todos...")
        for todo_id in self.created_todos:
            try:
                response = requests.delete(f"{self.api_url}/todos/{todo_id}")
                if response.status_code == 200:
                    print(f"   ✅ Deleted todo {todo_id}")
                else:
                    print(f"   ⚠️  Failed to delete todo {todo_id}")
            except Exception as e:
                print(f"   ❌ Error deleting todo {todo_id}: {str(e)}")

def main():
    print("🚀 Starting Todo API Tests...")
    print("=" * 50)
    
    tester = TodoAPITester()
    
    try:
        # Test 1: Root endpoint
        success, _ = tester.test_root_endpoint()
        if not success:
            print("❌ Root API not accessible, stopping tests")
            return 1

        # Test 2: Create todo (for other tests)
        print("\n📝 Testing Todo Creation...")
        success, test_todo_id = tester.test_create_todo("Backend Test Todo", "Test todo for API validation", "high", "pending")
        if not success:
            print("❌ Cannot create todos, stopping tests")
            return 1

        # Test 3: List todos
        print("\n📋 Testing Todo Retrieval...")
        tester.test_get_todos()

        # Test 4: Get specific todo
        if test_todo_id:
            tester.test_get_todo_by_id(test_todo_id)

        # Test 5: Test filters
        print("\n🔍 Testing Filters...")
        tester.test_get_todos_with_filters()

        # Test 6: Update todo
        print("\n✏️  Testing Todo Update...")
        if test_todo_id:
            tester.test_update_todo(test_todo_id)

        # Test 7: Summary/Insights
        print("\n📊 Testing Summary/Insights...")
        tester.test_get_summary()

        # Test 8: Delete todo
        print("\n🗑️  Testing Todo Deletion...")
        if test_todo_id:
            success = tester.test_delete_todo(test_todo_id)
            if success:
                # Remove from cleanup list since it's already deleted
                tester.created_todos.remove(test_todo_id)

        # Test additional scenarios
        print("\n🔄 Testing Edge Cases...")
        
        # Create multiple todos for better testing
        tester.test_create_todo("High Priority Task", "Important work", "high", "pending")
        tester.test_create_todo("Medium Priority Task", "Regular work", "medium", "in-progress") 
        tester.test_create_todo("Completed Task", "Finished work", "low", "completed")

        print("\n" + "=" * 50)
        print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
        
        if tester.tests_passed == tester.tests_run:
            print("🎉 All backend API tests passed!")
            return_code = 0
        else:
            print("⚠️  Some backend API tests failed")
            return_code = 1

        # Cleanup
        tester.cleanup_created_todos()
        
        return return_code

    except Exception as e:
        print(f"❌ Test suite error: {str(e)}")
        tester.cleanup_created_todos()
        return 1

if __name__ == "__main__":
    sys.exit(main())