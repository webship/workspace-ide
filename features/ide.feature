Feature: The Web IDE plugin
  Once the plugin is activated, every project row carries the IDE menu, and the Plugins page lists
  the plugin with its four steps.

  Scenario: A project row offers the IDE menu
    Given I am on "/dev"
     Then the element ".act-menu-ide" should be displayed
      And I should see "IDE"

  Scenario: The plugin is listed on the Plugins page
    Given I am on "/settings/plugins"
     Then I should see "Web IDE"
      And I should see "@webship.co/workspace-ide"

  Scenario: The AI Skills folder lists the skill the plugin ships
    Given I am on "/ai-skills"
     Then I should see "ide-open-with"

  Scenario: The AI Commands folder lists the command the plugin ships
    Given I am on "/ai-commands"
     Then I should see "ide-links"

  Scenario: The AI Prompts folder lists the prompt the plugin ships
    Given I am on "/ai-prompts"
     Then I should see "ide-web-ide-check"
